import { getAllStaff } from '../actions/staff';
import StaffClient from './StaffClient';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  const staff = await getAllStaff();
  return <StaffClient initialStaff={staff} />;
}