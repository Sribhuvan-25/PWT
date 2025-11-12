import { sendPushNotification } from './notificationService';
import * as PushTokensRepo from '@/db/repositories/pushTokens';
import * as SessionsRepo from '@/db/repositories/sessions';
import * as MembersRepo from '@/db/repositories/members';
import { getSupabase } from '@/db/supabase';
import { logger } from '@/utils/logger';

/**
 * Send notification to session admins when a new buy-in is requested
 */
export async function notifyBuyInRequest(
  sessionId: string,
  memberName: string,
  amountCents: number
): Promise<void> {
  try {
    // Get session info
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from('sessions')
      .select('name')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // Get admin push tokens
    const adminTokens = await PushTokensRepo.getSessionAdminPushTokens(sessionId);

    if (adminTokens.length === 0) {
      logger.info('No admin push tokens found for session:', sessionId);
      return;
    }

    const title = 'New Buy-in Request';
    const body = `${memberName} requested a buy-in of $${(amountCents / 100).toFixed(2)} in "${session.name}"`;

    // Send notification to all admins
    const promises = adminTokens.map(tokenData =>
      sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          type: 'buyin-request',
          sessionId,
          memberName,
          amountCents,
        },
        'buyin-requests'
      ).then(success => {
        if (success) {
          // Update last used timestamp
          PushTokensRepo.updateTokenLastUsed(tokenData.id).catch((err) => logger.error('Failed to update token last used', err));
        }
      })
    );

    await Promise.all(promises);
    logger.info(`Sent buy-in notification to ${adminTokens.length} admin(s)`);
  } catch (error) {
    logger.error('Error sending buy-in notification:', error);
  }
}

/**
 * Send notification when a buy-in is approved
 */
export async function notifyBuyInApproved(
  sessionId: string,
  memberUserId: string | undefined,
  amountCents: number
): Promise<void> {
  if (!memberUserId) return; // Can't notify if member doesn't have a user account

  try {
    // Get session info
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from('sessions')
      .select('name')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // Get member's push tokens
    const memberTokens = await PushTokensRepo.getUserPushTokens(memberUserId);

    if (memberTokens.length === 0) {
      logger.info('No push tokens found for member:', memberUserId);
      return;
    }

    const title = 'Buy-in Approved';
    const body = `Your buy-in of $${(amountCents / 100).toFixed(2)} was approved in "${session.name}"`;

    // Send notification to member
    const promises = memberTokens.map(tokenData =>
      sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          type: 'buyin-approved',
          sessionId,
          amountCents,
        },
        'default'
      ).then(success => {
        if (success) {
          PushTokensRepo.updateTokenLastUsed(tokenData.id).catch((err) => logger.error('Failed to update token last used', err));
        }
      })
    );

    await Promise.all(promises);
    logger.info(`Sent approval notification to member`);
  } catch (error) {
    logger.error('Error sending buy-in approval notification:', error);
  }
}

/**
 * Send notification for unpaid settlements
 */
export async function notifyUnpaidSettlement(
  sessionId: string,
  fromMemberId: string,
  toMemberId: string,
  amountCents: number
): Promise<void> {
  try {
    // Get session info
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from('sessions')
      .select('name')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // Get member info
    const fromMember = await MembersRepo.getMemberById(fromMemberId);
    const toMember = await MembersRepo.getMemberById(toMemberId);

    if (!fromMember || !toMember || !fromMember.userId) return;

    // Get push tokens for the person who owes money
    const tokens = await PushTokensRepo.getUserPushTokens(fromMember.userId);

    if (tokens.length === 0) {
      logger.info('No push tokens found for member:', fromMember.userId);
      return;
    }

    const title = 'Settlement Reminder';
    const body = `You owe ${toMember.name} $${(amountCents / 100).toFixed(2)} from "${session.name}"`;

    // Send notification
    const promises = tokens.map(tokenData =>
      sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          type: 'settlement-reminder',
          sessionId,
          fromMemberId,
          toMemberId,
          amountCents,
        },
        'settlements'
      ).then(success => {
        if (success) {
          PushTokensRepo.updateTokenLastUsed(tokenData.id).catch((err) => logger.error('Failed to update token last used', err));
        }
      })
    );

    await Promise.all(promises);
    logger.info(`Sent settlement reminder`);
  } catch (error) {
    logger.error('Error sending settlement reminder:', error);
  }
}

/**
 * Send notification to all members when session is completed
 */
export async function notifySessionCompleted(sessionId: string): Promise<void> {
  try {
    // Get session info
    const supabase = getSupabase();
    const { data: session } = await supabase
      .from('sessions')
      .select('name')
      .eq('id', sessionId)
      .single();

    if (!session) return;

    // Get all session members with user IDs
    const { data: sessionMembers } = await supabase
      .from('session_members')
      .select('user_id')
      .eq('session_id', sessionId);

    if (!sessionMembers || sessionMembers.length === 0) return;

    const userIds = sessionMembers.map(sm => sm.user_id);

    // Get push tokens for all members
    const tokens = await PushTokensRepo.getPushTokensForUsers(userIds);

    if (tokens.length === 0) {
      logger.info('No push tokens found for session members');
      return;
    }

    const title = 'Session Completed';
    const body = `"${session.name}" has been completed. Check your settlements!`;

    // Send notification to all members
    const promises = tokens.map(tokenData =>
      sendPushNotification(
        tokenData.token,
        title,
        body,
        {
          type: 'session-completed',
          sessionId,
        },
        'default'
      ).then(success => {
        if (success) {
          PushTokensRepo.updateTokenLastUsed(tokenData.id).catch((err) => logger.error('Failed to update token last used', err));
        }
      })
    );

    await Promise.all(promises);
    logger.info(`Sent session completion notification to ${tokens.length} member(s)`);
  } catch (error) {
    logger.error('Error sending session completion notification:', error);
  }
}

/**
 * Send reminder for all unpaid settlements in a session
 */
export async function sendSettlementReminders(sessionId: string): Promise<void> {
  try {
    const supabase = getSupabase();

    // Get unpaid settlements
    const { data: settlements } = await supabase
      .from('settlements')
      .select('*')
      .eq('session_id', sessionId)
      .eq('paid', false);

    if (!settlements || settlements.length === 0) {
      logger.info('No unpaid settlements found');
      return;
    }

    // Send reminders for each settlement
    const promises = settlements.map(settlement =>
      notifyUnpaidSettlement(
        sessionId,
        settlement.from_member_id,
        settlement.to_member_id,
        settlement.amount_cents
      )
    );

    await Promise.all(promises);
  } catch (error) {
    logger.error('Error sending settlement reminders:', error);
  }
}
