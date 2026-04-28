import ApiListPage from "../../components/common/ApiListPage";
import { getWeeklyLogs } from "../../api/weeklyLogsApi";

function StudentsWeeklyLogsPage() {
  return (
    <ApiListPage
      title="Weekly Logs"
      description="This page displays weekly internship logbook entries."
      fetchData={getWeeklyLogs}
      emptyMessage="No weekly logs found yet."
      renderItem={(log) => (
        <div>
          <h2>
            Week {log.week_number}: {log.title}
          </h2>

          <p>
            <strong>Status:</strong> {log.status}
          </p>

          <p>
            <strong>Activities:</strong> {log.activities}
          </p>

          <p>
            <strong>Challenges:</strong>{" "}
            {log.challenges || "No challenges recorded"}
          </p>

          <p>
            <strong>Lessons Learned:</strong>{" "}
            {log.lessons_learned || "Not provided"}
          </p>

          <p>
            <strong>Submitted At:</strong>{" "}
            {log.submitted_at || "Not submitted yet"}
          </p>
        </div>
      )}
    />
  );
}

export default StudentsWeeklyLogsPage;