let incomeRows = [];
let spendingRows = [];
let chart = new Chart();
let currentCalculatorId = null;
let calculatorName = "New Calculator";
let templateCache = [];

// === Utility Functions for Settings ===
function getCurrencySymbol() {
  return document.getElementById("currencySetting").value;
}

function getSavingsPercent() {
  return parseFloat(document.getElementById("savingsPercent").value || 0) / 100;
}

function getSosPercent() {
  return parseFloat(document.getElementById("sosPercent").value || 0) / 100;
}
// === Income Management ===
function addIncomeRow() {
  incomeRows.push({ source: "", amount: 0 });
  renderAll();
}

function updateIncomeField(index, field, value) {
  if (field === "amount") value = parseFloat(value) || 0;
  incomeRows[index][field] = value;
  renderAll();
}

function removeIncomeRow(index) {
  incomeRows.splice(index, 1);
  renderAll();
}

// === Spending Management ===
//Render All Spending Rows
function addSpendingRow() {
  spendingRows.push({
    category: "",
    planned: 0,
    actual: 0,
    type: "simple",
    details: [],
  });
  renderAll();
}

function updateSpendingField(index, field, value) {
  if (["planned", "actual"].includes(field)) value = parseFloat(value) || 0;
  spendingRows[index][field] = value;
  renderAll();
}

function changeSpendingType(index, type) {
  spendingRows[index].type = type;
  renderAll();
}
// === Advanced Sub-Spending (Details) Management ===
function addDetail(index) {
  spendingRows[index].details.push({ date: "", where: "", amount: 0 });
  updateActualFromDetails(index);
}

function updateDetail(index, dIndex, field, value) {
  if (field === "amount") value = parseFloat(value) || 0;
  spendingRows[index].details[dIndex][field] = value;
  updateActualFromDetails(index);
}

function updateActualFromDetails(index) {
  const total = spendingRows[index].details.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  spendingRows[index].actual = total;
  renderAll();
}
// === Formatting & UI Helpers ===
function formatCurrency(value) {
  const currency = getCurrencySymbol();
  return (
    currency + value.toLocaleString(undefined, { minimumFractionDigits: 2 })
  );
}

function showUnsavedStatus() {
  const statusEl = document.getElementById("calculatorSavedStatus");
  if (statusEl) {
    statusEl.textContent = "❌ Not Saved";
  }
}

function removeSpendingRow(index) {
  spendingRows.splice(index, 1);
  renderAll();
}

function removeDetail(index, dIndex) {
  spendingRows[index].details.splice(dIndex, 1);
  updateActualFromDetails(index);
}

// === Chart Rendering for Advanced Sub-Spending ===
function renderAdvancedChart(index, row) {
  const ctx = document.getElementById(`chart-${index}`).getContext("2d");
  if (!ctx) return;

  // Cleanup if it exists
  if (!window.advancedCharts) window.advancedCharts = {};
  if (window.advancedCharts[index]) {
    window.advancedCharts[index].destroy();
  }

  const labels = row.details.map((d) => d.date || "No Date");
  const data = row.details.map((d) => d.amount || 0);

  window.advancedCharts[index] = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: row.category || "Category",
          data: data,
          borderColor: "#36a2eb",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      plugins: {
        legend: { labels: { color: "white" } },
        tooltip: {
          callbacks: {
            label: function (context) {
              const where = row.details[context.dataIndex]?.where || "Unknown";
              const amount = context.parsed.y;
              return `${where}: ${amount}`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "white" },
          grid: { color: "#444" },
        },
        x: {
          ticks: { color: "white" },
          grid: { color: "#444" },
        },
      },
    },
  });
}
// === Master Render Function ===
function renderAll() {
  // === Render Income Table ===
  const incomeTbody = document.querySelector("#incomeTable tbody");
  incomeTbody.innerHTML = "";
  let totalIncome = 0;
  incomeRows.forEach((row, i) => {
    totalIncome += row.amount;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" value="${row.source}" onchange="updateIncomeField(${i}, 'source', this.value)"></td>
      <td><input type="number" value="${row.amount}" onchange="updateIncomeField(${i}, 'amount', this.value)"></td>
      <td><button onclick="removeIncomeRow(${i})">❌</button></td>
    `;
    incomeTbody.appendChild(tr);
  });
  document.getElementById("totalIncome").textContent =
    formatCurrency(totalIncome);
   // === Render Spending Table & Advanced Details ===
  const spendingTbody = document.querySelector("#spendingTable tbody");
  const advancedContainer = document.getElementById("advancedTables");
  spendingTbody.innerHTML = "";
  advancedContainer.innerHTML = "";
  let totalPlanned = 0,
    totalActual = 0;

  spendingRows.forEach((row, i) => {
    totalPlanned += row.planned;
    totalActual += row.actual;
    const left = row.planned - row.actual;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="text" value="${
        row.category
      }" onchange="updateSpendingField(${i}, 'category', this.value)"></td>
      <td><input type="number" value="${
        row.planned
      }" onchange="updateSpendingField(${i}, 'planned', this.value)"></td>
      <td>${
        row.type === "simple"
          ? `<input type='number' value='${row.actual}' onchange="updateSpendingField(${i}, 'actual', this.value)">`
          : formatCurrency(row.actual)
      }</td>
      <td>${formatCurrency(left)}</td>
      <td>
        <select onchange="changeSpendingType(${i}, this.value)">
          <option value="simple" ${
            row.type === "simple" ? "selected" : ""
          }>Simple</option>
          <option value="advanced" ${
            row.type === "advanced" ? "selected" : ""
          }>Advanced</option>
        </select>
      </td>
      <td style="width:20px"><button onclick="removeSpendingRow(${i})">❌</button></td>

    `;
    spendingTbody.appendChild(tr);

    // === If 'Advanced' Type: Render Sub-Spending Table ===
    if (row.type === "advanced") {
      const section = document.createElement("div");
      section.classList.add("advanced-section");
      section.innerHTML = `<h3 style="margin-top:10px">${
        row.category || "Unnamed Category"
      } Details</h3>`;

      const table = document.createElement("table");
      table.innerHTML = `
        <thead><tr><th>Date</th><th>Where</th><th>Spent</th><th>Left</th><th></th></tr></thead>
        <tbody>
          ${row.details
            .map((d, j) => {
              const runningTotal = row.details
                .slice(0, j + 1)
                .reduce((sum, s) => sum + s.amount, 0);
              const left = row.planned - runningTotal;
              return `
              <tr>
                <td><input type="date" value="${
                  d.date
                }" onchange="updateDetail(${i}, ${j}, 'date', this.value)"></td>
                <td><input type="text" value="${
                  d.where
                }" onchange="updateDetail(${i}, ${j}, 'where', this.value)"></td>
                <td><input type="number" value="${
                  d.amount
                }" onchange="updateDetail(${i}, ${j}, 'amount', this.value)"></td>
                <td>${formatCurrency(left)}</td>
                <td style="width:20px"><button onclick="removeDetail(${i}, ${j})">❌</button></td>

              </tr>
            `;
            })
            .join("")}
        </tbody>
      `;
      section.appendChild(table);

      // Button to add sub-spending entries

      const addBtn = document.createElement("button");
      addBtn.textContent = "Add Sub-Spend";
      addBtn.onclick = () => addDetail(i);
      section.appendChild(addBtn);
      advancedContainer.appendChild(section);

      // Toggle chart for sub-spending
      const chartToggleBtn = document.createElement("button");
      chartToggleBtn.textContent = "📈 Show Chart";
      chartToggleBtn.style.marginLeft = "10px";
      chartToggleBtn.onclick = () => {
        const canvas = document.getElementById(`chart-${i}`);
        if (canvas.style.display === "none") {
          canvas.style.display = "block";
          renderAdvancedChart(i, row);
          chartToggleBtn.textContent = "📉 Hide Chart";
        } else {
          canvas.style.display = "none";
          chartToggleBtn.textContent = "📈 Show Chart";
        }
      };
      section.appendChild(chartToggleBtn);
      //Chart Canvas
      const canvas = document.createElement("canvas");
      canvas.id = `chart-${i}`;
      canvas.style.display = "none";
      canvas.height = 100;
      section.appendChild(canvas);
    }
  });
  // Update total summary row
  document.getElementById("totalPlanned").textContent =
    formatCurrency(totalPlanned);
  document.getElementById("totalActual").textContent =
    formatCurrency(totalActual);
  document.getElementById("totalLeft").textContent = formatCurrency(
    totalPlanned - totalActual
  );

  // === Render Savings Section ===
  const leftOver = totalIncome - totalActual;
  const savingsPct = getSavingsPercent();
  const sosPct = getSosPercent();

  const savingsTarget = leftOver * savingsPct;
  const sosTarget = leftOver * sosPct;

  const actualSavings = parseFloat(
    document.getElementById("actualSavings").value || 0
  );
  const actualSos = parseFloat(document.getElementById("actualSos").value || 0);
  const savingsTotal = savingsTarget + sosTarget;
  const actualTotal = actualSavings + actualSos;
  const leftWidth = leftOver - actualTotal;
  const goalPercentage =
    savingsTotal > 0 ? Math.min((actualTotal / savingsTotal) * 100, 100) : 0;

  document.getElementById("savingsLeftEst").textContent =
    formatCurrency(leftOver);
  document.getElementById("savingsLeftAct").textContent =
    formatCurrency(leftOver);
  document.getElementById("savingsTarget").textContent =
    formatCurrency(savingsTarget);
  document.getElementById("sosTarget").textContent = formatCurrency(sosTarget);
  document.getElementById("savingsEstTotal").textContent =
    formatCurrency(savingsTotal);
  document.getElementById("savingsActualTotal").textContent =
    formatCurrency(actualTotal);
  document.getElementById("goalReached").textContent =
    goalPercentage.toFixed(0) + "%";
    document.getElementById("leftWith").textContent =
    formatCurrency(leftWidth);

  // === Render Spending Chart (Bar) ===
  const ctx = document.getElementById("spendingChart").getContext("2d");
  const labels =
    spendingRows.map((row) => row.category || "Unnamed") || "No Data";
  const data = spendingRows.map((row) => row.actual) || 0;

  if (!window.chartspent) {
    window.chartspent = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Actual Spending",
            data: data,
            backgroundColor: [
              "#ff6384",
              "#36a2eb",
              "#ffce56",
              "#66ff66",
              "#cc99ff",
              "#ff9966",
              "#6699ff",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          legend: { labels: { color: "white" } },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "white" },
            grid: { color: "#444" },
          },
          x: {
            ticks: { color: "white" },
            grid: { color: "#444" },
          },
        },
      },
    });
  } else {
    window.chartspent.data.labels = labels;
    window.chartspent.data.datasets[0].data = data;
    window.chartspent.update();
  }

  // === Render Savings Chart (Comparison Bar) ===
  const savingsCtx = document.getElementById("savingsChart").getContext("2d");
  const savingsLabels = ["Savings", "SOS Fund", "Total"];
  const savingsEstData = [savingsTarget, sosTarget, savingsTarget + sosTarget];
  const savingsActualData = [
    actualSavings,
    actualSos,
    actualSavings + actualSos,
  ];

  if (!window.chartsaving) {
    window.chartsaving = new Chart(savingsCtx, {
      type: "bar",
      data: {
        labels: savingsLabels,
        datasets: [
          {
            label: "Estimated",
            data: savingsEstData,
            backgroundColor: "#36a2eb",
            barThickness: 30,
          },
          {
            label: "Actual",
            data: savingsActualData,
            backgroundColor: "#4bc0c0",
            barThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          tooltip: {
            enabled: true,
            callbacks: {
              label: function (context) {
                return `${
                  context.dataset.label
                }: ${getCurrencySymbol()}${context.raw.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                  }
                )}`;
              },
            },
          },
          legend: {
            labels: {
              color: "white",
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "white" },
            grid: { color: "#444" },
          },
          x: {
            ticks: { color: "white" },
            grid: { color: "#444" },
          },
        },
      },
    });
  } else {
    window.chartsaving.data.datasets[0].data = savingsEstData;
    window.chartsaving.data.datasets[1].data = savingsActualData;
    window.chartsaving.update();
  }

  //Finally Update the UI
  showUnsavedStatus();
  loadSidebarCalculators();
}

// === Save the current calculator (new or existing) ===
async function saveCalculator() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

  // Fetch existing calculators to prevent duplicate names
  const existing = await fetch("/api/calculators/" + user._id);
  const existingCals = await existing.json();

  // Check if calculator name is already in use
  const nameAlreadyUsed = existingCals.some(
    (c) => c.name === calculatorName && c._id !== currentCalculatorId
  );

  if (nameAlreadyUsed) {
    showPopup(
      "You already have a calculator with this name. Please use a different name."
    );
    return;
  }

  // Prepare calculator payload for saving
  const payload = {
    userId: user._id,
    name: calculatorName,
    data: {
      incomeRows,
      spendingRows,
      currency: getCurrencySymbol(),
      savingsPercent: getSavingsPercent(),
      sosPercent: getSosPercent(),
    },
  };

  let response;
  // PUT if editing existing, POST if creating new
  if (currentCalculatorId) {
    response = await fetch("/api/calculator/" + currentCalculatorId, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } else {
    response = await fetch("/api/calculators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }
  // Handle response and update currentCalculatorId if new
  const data = await response.json();

  if (!currentCalculatorId) {
    currentCalculatorId = data._id;
  }

  // Show success and refresh sidebar
  showPopup(`💾 "${calculatorName}" saved successfully!`, true);
  loadSidebarCalculators();
  const statusEl = document.getElementById("calculatorSavedStatus");
  statusEl.textContent = "✔️ Saved";
}

// === Delete the current calculator functiona ===
async function deleteCalculator() {
  if (!currentCalculatorId) {
    showPopup("This calculator hasn't been saved yet.");
    return;
  }

  console.log("Deleting calculator:", currentCalculatorId);

  // Confirm deletion
  if (!confirm("Are you sure you want to delete this calculator?")) return;

  // Send DELETE request
  const res = await fetch("/api/calculator/" + currentCalculatorId, {
    method: "DELETE"
  });
  // Handle result / Initiate Deletion
  if (res.ok) {
    showPopup("🗑️ Calculator deleted.", true);
    currentCalculatorId = null;
    calculatorName = "New Calculator";
    incomeRows = [];
    spendingRows = [];
    document.getElementById("calculatorNameInput").value = calculatorName;
    renderAll();
  } else {
    showPopup("Failed to delete calculator.");
  }
}

// === Load an existing calculator into the UI ===
async function loadCalculator(id) {
  const res = await fetch("/api/calculator/" + id);
  const calc = await res.json();

  currentCalculatorId = calc._id;
  calculatorName = calc.name;

  incomeRows = calc.data.incomeRows;
  spendingRows = calc.data.spendingRows;
  document.getElementById("currencySetting").value = calc.data.currency;
  document.getElementById("savingsPercent").value =
    calc.data.savingsPercent * 100;
  document.getElementById("sosPercent").value = calc.data.sosPercent * 100;
  document.getElementById("calculatorNameInput").value = calculatorName;

  renderAll();
}

// === Show modal with template calculators to duplicate ===
function openTemplateSelector(calculators) {
  templateCache = calculators;
  const modal = document.getElementById("templateModal");
  const select = document.getElementById("templateSelect");

  select.innerHTML = "";
  calculators.forEach((c) => {
    const option = document.createElement("option");
    option.value = c._id;
    option.textContent = c.name;
    select.appendChild(option);
  });

  modal.style.display = "flex";
}

// === Close the template modal window ===
function closeTemplateModal() {
  document.getElementById("templateModal").style.display = "none";
}

// === Duplicate selected template into new calculator ===
function duplicateSelectedTemplate() {
  const selectedId = document.getElementById("templateSelect").value;
  const template = templateCache.find((c) => c._id === selectedId);
  if (!template) return;

  incomeRows = JSON.parse(JSON.stringify(template.data.incomeRows));
  spendingRows = JSON.parse(JSON.stringify(template.data.spendingRows));
  currentCalculatorId = null;
  calculatorName = template.name + " Copy";
  document.getElementById("calculatorNameInput").value = calculatorName;

  closeTemplateModal();
  renderAll();
  showUnsavedStatus();
}

// === Load and render list of all user calculators in sidebar ===
async function loadSidebarCalculators() {
  const user = JSON.parse(localStorage.getItem("loggedInUser"));
  const res = await fetch("/api/calculators/" + user._id);
  const calculators = await res.json();

  const list = document.querySelector(".panel ul");
  list.innerHTML = ""; // Clear existing

  calculators.forEach((c) => {
    const li = document.createElement("li");
    li.textContent = c.name;
    li.onclick = () => loadCalculator(c._id);
    list.appendChild(li);
  });

  // Option to create new calculator
  const newLi = document.createElement("li");
  newLi.innerHTML = `<span style="color: #a18fff;">➕ Add Calculator</span>`;
  newLi.onclick = () => {
    incomeRows = [];
    spendingRows = [];
    currentCalculatorId = null;
    calculatorName = "New Calculator";
    document.getElementById("calculatorNameInput").value = calculatorName;
    renderAll();
    showUnsavedStatus();
  };
  list.appendChild(newLi);

  
  // Option to create from template
  const fromTemplate = document.createElement("li");
  fromTemplate.innerHTML = `<span style="color: #87e2ff;">📄 Add from Template</span>`;
  fromTemplate.onclick = () => openTemplateSelector(calculators);
  list.appendChild(fromTemplate);
}

document.addEventListener("DOMContentLoaded", () => {
    loadSidebarCalculators();
    renderAll();
  });

