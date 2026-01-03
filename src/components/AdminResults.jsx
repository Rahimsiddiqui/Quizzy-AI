import { useState, useEffect } from "react";
import { getQuizResults } from "../services/adminService";
import { toast } from "react-toastify";

export default function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quizFilter, setQuizFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  useEffect(() => {
    fetchResults();
  }, [pagination.page, quizFilter]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchResults();
    }, 15000);

    return () => clearInterval(interval);
  }, [pagination.page, quizFilter]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const data = await getQuizResults(
        pagination.page,
        pagination.limit,
        quizFilter
      );
      setResults(data.results);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in w-full">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Quiz Results</h1>
        <p className="text-gray-600 mt-2">
          View all quiz submissions and scores
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Filter by quiz name..."
          value={quizFilter}
          onChange={(e) => {
            setQuizFilter(e.target.value);
            setPagination({ ...pagination, page: 1 });
          }}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  User
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Quiz
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : results.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No results found
                  </td>
                </tr>
              ) : (
                results.map((result) => {
                  const scorePercentage =
                    result.totalMarks > 0
                      ? Math.round((result.score / result.totalMarks) * 100)
                      : 0;

                  return (
                    <tr key={result._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {result.user}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {result.userEmail}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {result.quiz?.substring(0, 35)}...
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              scorePercentage >= 70
                                ? "bg-green-100 text-green-800"
                                : scorePercentage >= 50
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {scorePercentage}%
                          </span>
                          <span className="text-xs text-gray-500">
                            ({result.score}/{result.totalMarks})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(result.date).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() =>
              setPagination({
                ...pagination,
                page: Math.max(1, pagination.page - 1),
              })
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>

          <button
            onClick={() =>
              setPagination({
                ...pagination,
                page: Math.min(pagination.pages, pagination.page + 1),
              })
            }
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
