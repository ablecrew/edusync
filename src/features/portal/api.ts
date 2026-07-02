import { supabase } from '@/lib/supabase/client';

export async function trackApplication(applicationNo: string, phoneLast4: string) {
  const { data, error } = await supabase.rpc('portal_track_application', { _app_no: applicationNo, _phone_last4: phoneLast4 });
  if (error) throw error;
  return (data ?? [])[0] ?? null;
}
export async function portalLogin(username: string, password: string) {
  const { data, error } = await supabase.rpc('portal_login', { _username: username, _password: password });
  if (error) throw error;
  const row = (data ?? [])[0];
  if (!row) return null;
  return {
    id: row.out_id,
    account_type: row.out_account_type,
    student_id: row.out_student_id,
    full_name: row.out_full_name,
    must_change_password: row.out_must_change_password,
    email: row.out_email,
    phone: row.out_phone,
  };
}
export async function portalChangePassword(accountId: string, oldPass: string, newPass: string) {
  const { data, error } = await supabase.rpc('portal_change_password', { _account_id: accountId, _old: oldPass, _new: newPass });
  if (error) throw error;
  return data as boolean;
}
export async function fetchPortalNotifications(studentId: string) {
  const { data, error } = await supabase.from('notifications').select('*')
    .or(`student_id.eq.${studentId},application_id.in.(select id from admission_applications where enrolled_student_id.eq.${studentId})`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function fetchPortalStudent(studentId: string) {
  const { data, error } = await supabase.from('students').select('*').eq('id', studentId).single();
  if (error) throw error;
  return data;
}

export async function fetchPortalLibraryActivity(accountId: string) {
  const { data, error } = await supabase.rpc('portal_library_activity', { _account_id: accountId });
  if (error) throw error;
  return data ?? [];
}