let incomeRows = [];
let spendingRows = [];
let chart = new Chart();
let currentCalculatorId = null;
let calculatorName = "New Calculator";
let templateCache = [];

/**
 * @file spending.js
 * Gets the selected currency symbol from the settings.
 * @returns {string} The selected currency symbol.
 */
function getCurrencySymbol() {
  return document.getElementById("currencySetting").value;
}

/**
 * @file spending.js
 * Gets the savings percentage as a decimal.
 * @returns {number} The savings percentage (e.g., 0.15 for 15%).
 */
function getSavingsPercent() {
  return parseFloat(document.getElementById("savingsPercent").value || 0) / 100;
}
/**
 * @file spending.js
 * Gets the SOS fund percentage as a decimal.
 * @returns {number} The SOS fund percentage (e.g., 0.05 for 5%).
 */
function getSosPercent() {
  return parseFloat(document.getElementById("sosPercent").value || 0) / 100;
}
/**
 * @file spending.js
 * Adds a new row to the income data structure.
 * Each row includes a source name and an amount.
 */
function addIncomeRow() {
  incomeRows.push({ source: "", amount: 0 });
  renderAll();
}
/**
 * @file spending.js
 * Updates a specific field of a given income row.
 * @param {number} index - The index of the income row to update.
 * @param {string} field - The field to update ("source" or "amount").
 * @param {string|number} value - The new value for the field.
 */
function updateIncomeField(index, field, value) {
  if (field === "amount") value = parseFloat(value) || 0;
  incomeRows[index][field] = value;
  renderAll();
}
/**
 * @file spending.js
 * Removes an income row by its index.
 * @param {number} index - The index of the income row to remove.
 */
function removeIncomeRow(index) {
  incomeRows.splice(index, 1);
  renderAll();
}

/**
 * @file spending.js
 * Adds a new spending row to the spending data structure.
 * Initializes with empty category, 0 planned/actual, and type "simple".
 */
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
/**
 * @file spending.js
 * Updates a specific field of a given spending row.
 * @param {number} index - The index of the spending row to update.
 * @param {string} field - The field to update ("category", "planned", "actual", etc.).
 * @param {string|number} value - The new value to set for the field.
 */
function updateSpendingField(index, field, value) {
  if (["planned", "actual"].includes(field)) value = parseFloat(value) || 0;
  spendingRows[index][field] = value;
  renderAll();
}
/**
 * @file spending.js
 * Changes the spending type for a given row (e.g., from "simple" to "advanced").
 * @param {number} index - The index of the spending row to update.
 * @param {string} type - The new spending type ("simple" or "advanced").
 */
function changeSpendingType(index, type) {
  spendingRows[index].type = type;
  renderAll();
}
/**
 * @file spending.js
 * Adds a new detail entry to a specific spending row's details array.
 * Initializes with empty date, where, and amount.
 * @param {number} index - The index of the spending row to add the detail to.
 */
function addDetail(index) {
  spendingRows[index].details.push({ date: "", where: "", amount: 0 });
  updateActualFromDetails(index);
}
/**
 * @file spending.js
 * Updates a specific field of a detail entry in a spending row.
 * @param {number} index - Index of the spending row.
 * @param {number} dIndex - Index of the detail entry within the spending row.
 * @param {string} field - The field to update ("date", "where", or "amount").
 * @param {string|number} value - The new value to set.
 */
function updateDetail(index, dIndex, field, value) {
  if (field === "amount") value = parseFloat(value) || 0;
  spendingRows[index].details[dIndex][field] = value;
  updateActualFromDetails(index);
}
/**
 * @file spending.js
 * Recalculates the actual amount of a spending row by summing all detail amounts.
 * Updates the actual field and re-renders the UI.
 * @param {number} index - The index of the spending row to update.
 */
function updateActualFromDetails(index) {
  const total = spendingRows[index].details.reduce(
    (sum, d) => sum + d.amount,
    0
  );
  spendingRows[index].actual = total;
  renderAll();
}
/**
 * @file spending.js
 * Formats a number as currency using the selected currency symbol.
 * @param {number} value - The numeric value to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(value) {
  const currency = getCurrencySymbol();
  return (
    currency + value.toLocaleString(undefined, { minimumFractionDigits: 2 })
  );
}
/**
 * @file spending.js
 * Displays a "Not Saved" status message in the calculator UI.
 * Intended to be called when the user makes unsaved changes.
 */
function showUnsavedStatus() {
  const statusEl = document.getElementById("calculatorSavedStatus");
  if (statusEl) {
    statusEl.textContent = "❌ Not Saved";
  }
}
/**
 * @file spending.js
 * Removes a spending row at the specified index.
 * @param {number} index - The index of the spending row to remove.
 */
function removeSpendingRow(index) {
  spendingRows.splice(index, 1);
  renderAll();
}
/**
 * @file spending.js
 * Removes a detail row from a spending row's details array.
 * @param {number} index - The index of the spending row.
 * @param {number} dIndex - The index of the detail to remove.
 */
function removeDetail(index, dIndex) {
  spendingRows[index].details.splice(dIndex, 1);
  updateActualFromDetails(index);
}

// === Chart Rendering for Advanced Sub-Spending ===
/**
 * @file spending.js
 * Renders a line chart for advanced sub-spending details of a specific row.
 * @param {number} index - The index of the spending row.
 * @param {object} row - The spending row object containing category and details.
 */
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
/**
 * @file spending.js
 * Renders the entire calculator UI.
 * - Income table
 * - Spending table (simple and advanced)
 * - Sub-spending rows
 * - Advanced charts for each spending row
 * - Total summaries and leftover calculations
 * - Savings targets, actuals, and goal progress
 * - Bar charts for spending and savings comparisons
 * - Updates UI elements and saves status
 */
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

/**
 * @file spending.js
 * Saves the current calculator to the backend.
 * - Validates duplicate calculator names
 * - Sends calculator data (income, spending, settings)
 * - Handles new (POST) and existing (PUT) saves
 * - Updates the current calculator ID
 * - Shows a popup message and refreshes sidebar
 * 
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * @file spending.js
 * Loads a calculator by ID from the backend and populates the UI with its data.
 * @async
 * @param {string} id - The ID of the calculator to load.
 * @returns {Promise<void>}
 */
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
/**
 * @file spending.js
 * Opens a modal dialog showing available calculator templates to duplicate.
 * @param {Array<Object>} calculators - Array of calculator objects to display as templates.
 */
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

/**
 * @file spending.js
 * Closes the template modal window.
 */
function closeTemplateModal() {
  document.getElementById("templateModal").style.display = "none";
}

/**
 * @file spending.js
 * Duplicates the currently selected template into a new calculator instance.
 * Resets the currentCalculatorId, appends "Copy" to the name, and renders it.
 */
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

/**
 * @file spending.js
 * Loads and displays all calculators for the logged-in user in the sidebar.
 * Includes options to create a new calculator or load from a template.
 * @async
 * @returns {Promise<void>}
 */
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

/**
 * @file spending.js
 * Initializes the calculator app once the DOM is loaded.
 */

document.addEventListener("DOMContentLoaded", () => {
    loadSidebarCalculators();
    renderAll();
  });

