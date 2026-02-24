export type AttendanceStatus =
    | "not_started"
    | "working"
    | "finished";

export type Attendance = {
  userId: string;
  date: string;
  status: AttendanceStatus;
  startTime?: string;
  finishTime?: string;
};