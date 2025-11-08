// ZWL Currency Converter – GitHub Pages Compatible
//  Lisa Dube

const form = document.querySelector("form");
const resultDiv = document.querySelector("#result");
const amountInput = document.querySelector("#amount");
const fromSelect = document.querySelector("#from");
const toSelect = document.querySelector("#to");
const chartCanvas = document.getElementById("chart");

let chartInstance;

// Use a reliable HTTPS API endpoint
async function fetchRate(from, to) {
  try {
    const apiUrl = `https://v6.exchangerate-api.com/v6/2c5c1a7fffc7d5e29a17b4f1/latest/${from}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.result !== "success" || !data.conversion_rates[to]) {
      throw new Error("Invalid response");
    }

    return data.conversion_rates[to];
  } catch (error) {
    console.error("API error:", error);
    return null;
  }
}


// Handle form submit
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const from = fromSelect.value;
  const to = toSelect.value;
  const amount = parseFloat(amountInput.value);

  resultDiv.textContent = "Fetching live rates...";
  resultDiv.style.color = "#666";

  const rate = await fetchRate(from, to);
  if (!rate) {
    resultDiv.innerHTML = "❌ Error fetching rates. Please try again.";
    resultDiv.style.color = "#e74c3c";
    return;
  }

  const converted = (amount * rate).toFixed(2);
  resultDiv.innerHTML = `✅ ${amount} ${from} = <strong>${converted} ${to}</strong>`;
  resultDiv.style.color = "#111";

  // Fetch and render 7-day chart
  const trendData = await fetchTrendData(from, to);
  renderChart(trendData, from, to);
});

// Chart rendering
function renderChart(trendData, from, to) {
  if (!trendData.length) return;

  const labels = trendData.map((d) => d.day);
  const values = trendData.map((d) => d.rate);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: `${from} → ${to}`,
          data: values,
          borderColor: "#ff6b00",
          borderWidth: 2,
          fill: false,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true },
      },
      scales: {
        y: { beginAtZero: false },
      },
    },
  });
}
