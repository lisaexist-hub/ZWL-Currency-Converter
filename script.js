// Utility: format number with commas
const fmt = (n) => new Intl.NumberFormat().format(n);

const resultDiv = document.getElementById("result");
const updated = document.getElementById("updated");
const fromSel = document.getElementById("from");
const toSel = document.getElementById("to");
const amountInp = document.getElementById("amount");
const convertBtn = document.getElementById("convertBtn");
const chartTargetSel = document.getElementById("chartTarget");

async function safeFetchJson(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error("Network response was not ok");
  return res.json();
}

// Convert logic: handle ZWL even if API has quirks by using base=other & symbols=ZWL
async function convertCurrency(){
  const from = fromSel.value;
  const to = toSel.value;
  const amount = parseFloat(amountInp.value);
  if(!amount || amount <= 0){
    resultDiv.textContent = "⚠️ Please enter a valid amount.";
    return;
  }
  resultDiv.textContent = "Fetching live rates...";

  try{
    let converted = null;
    let ts = null;

    if(from === "ZWL" && to !== "ZWL"){
      // Need 1 ZWL in TO: get latest with base=to, symbols=ZWL then invert
      const url = `https://api.exchangerate.host/latest?base=${to}&symbols=ZWL`;
      const data = await safeFetchJson(url);
      const rateToZWL = data.rates?.ZWL;
      if(!rateToZWL) throw new Error("Rate unavailable");
      const zwl_per_to = rateToZWL; // 1 TO = X ZWL
      const to_per_zwl = 1/zwl_per_to; // 1 ZWL = Y TO
      converted = amount * to_per_zwl;
      ts = data.date;
    } else if(to === "ZWL" && from !== "ZWL"){
      // Get latest with base=from, symbols=ZWL directly
      const url = `https://api.exchangerate.host/latest?base=${from}&symbols=ZWL`;
      const data = await safeFetchJson(url);
      const rate = data.rates?.ZWL; // 1 FROM = rate ZWL
      if(!rate) throw new Error("Rate unavailable");
      converted = amount * rate;
      ts = data.date;
    } else if(from === "ZWL" && to === "ZWL"){
      converted = amount;
      ts = new Date().toISOString().slice(0,10);
    } else {
      // Neither side is ZWL, use convert endpoint
      const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`;
      const data = await safeFetchJson(url);
      converted = data.result;
      ts = data.date || (data.info?.timestamp ? new Date(data.info.timestamp*1000).toISOString() : new Date().toISOString());
    }

    resultDiv.textContent = `${fmt(amount)} ${from} = ${fmt(Number(converted.toFixed(4)))} ${to}`;
    updated.textContent = `Last updated: ${new Date(ts).toLocaleString()}`;
  }catch(e){
    console.error(e);
    resultDiv.textContent = "❌ Error fetching rates. Please try again.";
    updated.textContent = "";
  }
}

// Chart logic: show 7-day series of ZWL vs target (USD/GBP/ZAR)
// We fetch timeseries with base=target & symbols=ZWL, so dataset = ZWL per 1 target
let chart;
async function loadChart(target="USD"){
  const end = new Date();
  const start = new Date(end.getTime() - 6*24*3600*1000);
  const toISO = (d) => d.toISOString().slice(0,10);
  const url = `https://api.exchangerate.host/timeseries?base=${target}&symbols=ZWL&start_date=${toISO(start)}&end_date=${toISO(end)}`;

  const note = document.getElementById("chartNote");
  note.textContent = "Loading chart...";

  try{
    const data = await safeFetchJson(url);
    const rates = data.rates || {};
    const labels = Object.keys(rates).sort(); // chronological
    const values = labels.map(d => rates[d]?.ZWL ?? null).filter(v => v !== null);

    // If lengths differ due to missing days, filter both consistently
    const filteredLabels = labels.filter(d => rates[d]?.ZWL !== undefined);

    const ctx = document.getElementById("rateChart").getContext("2d");
    if(chart) chart.destroy();
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: filteredLabels,
        datasets: [{
          label: `1 ${target} in ZWL`,
          data: values,
          tension: 0.25,
          fill: false
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        },
        scales: {
          x: { ticks: { maxRotation: 0, autoSkip: true } },
          y: { beginAtZero: false }
        }
      }
    });
    note.textContent = `Source: exchangerate.host • Showing last 7 days • Base: ${target} (1 ${target} = X ZWL)`;
  }catch(e){
    console.error(e);
    if(chart) chart.destroy();
    document.getElementById("chartNote").textContent = "Unable to load chart data right now.";
  }
}

// Wire up events
convertBtn.addEventListener("click", convertCurrency);
chartTargetSel.addEventListener("change", (e)=>loadChart(e.target.value));
toSel.addEventListener("change", (e)=>{
  // If user selects USD/GBP/ZAR as "to", reflect it in chart target for a cohesive experience
  if(["USD","GBP","ZAR"].includes(e.target.value)){
    chartTargetSel.value = e.target.value;
    loadChart(e.target.value);
  }
});

// Initial state
document.addEventListener("DOMContentLoaded", ()=>{
  loadChart("USD");
});
