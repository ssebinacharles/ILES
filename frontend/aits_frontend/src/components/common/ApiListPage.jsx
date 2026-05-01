import { useEffect, useState } from "react";

function normalizeData(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (data && Array.isArray(data.results)) {
    return data.results;
  }

  if (data && typeof data === "object") {
    return [data];
  }

  return [];
}

function ApiListPage({
  title,
  description,
  fetchData,
  renderItem,
  renderTop,
  emptyMessage = "No records found yet.",
}) {
  const [items, setItems] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData()
      .then((data) => {
        setRawData(data);
        setItems(normalizeData(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [fetchData]);

  if (loading) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>{title}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "30px" }}>
        <h1>{title}</h1>
        <p style={{ color: "red" }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>{title}</h1>

      {description && <p>{description}</p>}

      {renderTop && renderTop(items, rawData)}

      {items.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div>
          {items.map((item, index) => (
            <div
              key={item.id || index}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
              }}
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <pre>{JSON.stringify(item, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      <details style={{ marginTop: "25px" }}>
        <summary>View raw API response</summary>
        <pre
          style={{
            background: "#f5f5f5",
            padding: "12px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export default ApiListPage;