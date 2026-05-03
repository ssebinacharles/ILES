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
  showRawResponse = false,
}) {
  const [items, setItems] = useState([]);
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function loadData() {
    setLoading(true);
    setError("");

    fetchData()
      .then((data) => {
        setRawData(data);
        setItems(normalizeData(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Failed to load records.");
        setLoading(false);
      });
  }

  useEffect(() => {
    loadData();
  }, [fetchData]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <h1>{title}</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <h1>{title}</h1>

        {description && <p>{description}</p>}

        <p style={errorStyle}>Error: {error}</p>

        <button onClick={loadData}>Try Again</button>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <h1>{title}</h1>

      {description && <p>{description}</p>}

      {renderTop && renderTop(items, rawData)}

      {items.length === 0 ? (
        <p>{emptyMessage}</p>
      ) : (
        <div>
          {items.map((item, index) => (
            <div key={item.id || index} style={itemBoxStyle}>
              {renderItem ? (
                renderItem(item, index)
              ) : (
                <pre style={preStyle}>{JSON.stringify(item, null, 2)}</pre>
              )}
            </div>
          ))}
        </div>
      )}

      {showRawResponse && (
        <details style={{ marginTop: "25px" }}>
          <summary>View raw API response</summary>

          <pre style={preStyle}>{JSON.stringify(rawData, null, 2)}</pre>
        </details>
      )}
    </div>
  );
}

const pageStyle = {
  padding: "30px",
};

const itemBoxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "12px",
  background: "#fff",
};

const errorStyle = {
  color: "red",
};

const preStyle = {
  background: "#f5f5f5",
  padding: "12px",
  overflowX: "auto",
  borderRadius: "6px",
};

export default ApiListPage;