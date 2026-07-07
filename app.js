/**
 * ==========================================================================
 * DemoCraft Core Application Controller (app.js)
 * Coordinates UI configurations, calculates ROI metrics, animates counters,
 * manages vertical themes, and integrates jsPDF document exporter engine.
 * ==========================================================================
 */

// Application State Management
const state = {
    company: "Acme Corp",
    url: "https://stripe.com",
    industry: "fintech",
    employees: 250,
    monthlyCost: 25000,
    tools: ["Salesforce", "Jira"],
    rates: {
        INR: 83.5, // Target Default base currency
        USD: 1.0,
        EUR: 0.92,
        GBP: 0.79,
        AED: 3.67,
        SGD: 1.35,
        AUD: 1.50,
        CAD: 1.37,
        JPY: 160.0,
        CNY: 7.25,
        BRL: 5.50,
        ZAR: 18.0,
        SAR: 3.75,
        SEK: 10.5,
        MXN: 18.2,
        KRW: 1380.0,
        NZD: 1.63,
        CHF: 0.90,
        HKD: 7.80,
        NOK: 10.6
    },
    currentCurrency: "INR",
    currencySymbol: "₹",
    logoUrl: "",
    calculatedROI: {
        timeSaved: 0,
        costSavedUsd: 0,
        productivity: 0,
        payback: 0,
        roiPercent: 0
    }
};

// DOM Elements cache
const elements = {
    form: document.getElementById('configurator-form'),
    companyNameInput: document.getElementById('company-name'),
    companyUrlInput: document.getElementById('company-url'),
    industrySelect: document.getElementById('industry-select'),
    employeeSlider: document.getElementById('employee-slider'),
    employeeValText: document.getElementById('employee-count-val'),
    manualCostInput: document.getElementById('manual-cost'),
    generateBtn: document.getElementById('generate-roi-btn'),
    
    // Section 2 Outputs
    roiLoader: document.getElementById('roi-loader'),
    metricTime: document.getElementById('metric-time'),
    metricCost: document.getElementById('metric-cost'),
    metricProductivity: document.getElementById('metric-productivity'),
    metricPayback: document.getElementById('metric-payback'),
    metricRoi: document.getElementById('metric-roi'),
    currencySymbolText: document.getElementById('metric-currency-symbol'),

    // Section 3 Company logo card
    logoLoader: document.getElementById('logo-loader'),
    prospectLogoImg: document.getElementById('prospect-logo'),
    logoTelemetry: document.getElementById('logo-telemetry'),
    logoDetailsName: document.querySelector('.details-company-name'),
    logoDetailsDomain: document.querySelector('.details-company-domain'),

    // Section 4 API Countries Sandbox
    countrySelect: document.getElementById('country-select'),
    btnRunCountries: document.getElementById('btn-run-countries'),
    countriesLoader: document.getElementById('countries-loader'),
    countriesTelemetry: document.getElementById('countries-telemetry'),
    countriesSummary: document.getElementById('countries-summary'),
    countriesJson: document.getElementById('countries-json'),
    countryCapital: document.getElementById('country-capital'),
    countryPopulation: document.getElementById('country-population'),
    countryCurrency: document.getElementById('country-currency'),
    countryRegion: document.getElementById('country-region'),
    countryFlag: document.getElementById('country-flag'),
    countryNameDisplay: document.getElementById('country-name-display'),

    // Section 4 API Exchange Sandbox
    currencySelect: document.getElementById('currency-select'),
    btnRunExchange: document.getElementById('btn-run-exchange'),
    exchangeLoader: document.getElementById('exchange-loader'),
    exchangeTelemetry: document.getElementById('exchange-telemetry'),
    exchangeJson: document.getElementById('exchange-json'),
    currentExchangeRateText: document.getElementById('current-exchange-rate'),

    // Section 4 API CRM Table Sandbox
    btnRunCrm: document.getElementById('btn-run-crm'),
    crmLoader: document.getElementById('crm-loader'),
    crmTelemetry: document.getElementById('crm-telemetry'),
    crmTable: document.getElementById('crm-table-contacts'),

    // Section 5 Summary Panel
    summaryLogoImg: document.getElementById('summary-logo'),
    summaryCompanyTitle: document.getElementById('summary-company-title'),
    summaryIndustryTag: document.getElementById('summary-industry-tag'),
    summaryRoiValText: document.getElementById('summary-roi-val'),
    summaryNarrative: document.getElementById('summary-narrative-text'),
    summaryChallenges: document.getElementById('summary-challenges-list'),
    summarySolutions: document.getElementById('summary-solutions-list'),
    summaryIntegrationScope: document.getElementById('summary-integration-scope'),
    summaryEmployeeScale: document.getElementById('summary-employee-scale'),
    btnExportPdf: document.getElementById('btn-export-pdf')
};

// Industry Rebranding Config profiles
const industryProfiles = {
    fintech: {
        name: "FinTech (Apex Finance)",
        themeClass: "theme-fintech",
        challenges: [
            "Manual compliance screening & tracking audits creating high delay overhead.",
            "High transaction fraud verification timelines bottlenecking operations.",
            "Fragmented billing connections requiring manual matching runs."
        ],
        solutions: [
            "Implement automated ledger integration syncing transactions dynamically.",
            "Deploy live compliance APIs evaluating identity risk within 200ms.",
            "Configure unified payments matching gateway with direct ERP connectors."
        ],
        text: "streamlines ledger audit flows and automates manual compliance pipelines. Connecting direct transaction data gateways eliminates auditing bottlenecks and cuts manual processing timelines."
    },
    healthcare: {
        name: "Healthcare (MediSync)",
        themeClass: "theme-healthcare",
        challenges: [
            "Patient data security issues with strict data governance compliance checks.",
            "Manual clinical workflow automation bottlenecks slowing physician intakes.",
            "Siloed electronic health record (EHR) databases creating data mapping errors."
        ],
        solutions: [
            "Establish encrypted patient vaults with single-click audit report engines.",
            "Automate hospital administrative referral routing and data extractions.",
            "Deploy secure FHIR-compliant gateways syncing record events dynamically."
        ],
        text: "protects patient data security and automates EHR workflow synchronization. Unified check-in features reduce admission overhead, keeping networks fully aligned and compliant."
    },
    ecommerce: {
        name: "E-Commerce (ShopFlow)",
        themeClass: "theme-ecommerce",
        challenges: [
            "Leaking checkout funnels driven by high cart abandonment spikes.",
            "Lagging inventory sync speeds causing stock allocation mismatch errors.",
            "Lack of post-purchase engagement workflows lowering customer retention."
        ],
        solutions: [
            "Schedule automated shopping cart recovery triggers within 15 minutes.",
            "Deploy real-time webhook broadcasts connecting warehouses instantly.",
            "Integrate personalized client retention feeds tracking multi-hub purchases."
        ],
        text: "optimizes purchase conversions and solves inventory synchronization loops. Dynamic webhook engines automate stock adjustments globally, turning abandoned transactions into secured sales."
    },
    saas: {
        name: "B2B SaaS (CloudCore)",
        themeClass: "theme-saas",
        challenges: [
            "High onboarding friction during manual enterprise customer setups.",
            "Usage metrics delay leading to customer churn risk detection lags.",
            "Fragmented API interfaces blocking customer expansion revenue metrics."
        ],
        solutions: [
            "Build automated team provisioning workflows inside the customer portal.",
            "Stream system consumption metrics directly to invoicing databases.",
            "Create self-service playgrounds to accelerate developer integrations."
        ],
        text: "solves onboarding friction and monitors client churn risks dynamically. Direct billing syncing provides enterprise buyers with instant self-service access, boosting GTM expansion speed."
    }
};

const currencySymbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "د.إ",
    SGD: "S$"
};

/* ==========================================================================
   Initialization and Event Bindings
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // Initial Setup
    updateTheme(state.industry);
    bindEvents();
    executeCalculations();
    updateSolutionSummary();
    setupScrollSpy();
    
    // Pre-load default logo
    enrichProspectLogo(state.url, state.company);
});

function bindEvents() {
    // Employee Slider interaction
    elements.employeeSlider.addEventListener('input', (e) => {
        elements.employeeValText.textContent = parseInt(e.target.value).toLocaleString();
    });

    // Configurator Form submit
    elements.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Capture inputs (assuming manualCost is entered in USD or baseline, converted dynamically)
        state.company = elements.companyNameInput.value.trim() || "Acme Corp";
        state.url = elements.companyUrlInput.value.trim() || "https://stripe.com";
        state.industry = elements.industrySelect.value;
        state.employees = parseInt(elements.employeeSlider.value);
        state.monthlyCost = parseFloat(elements.manualCostInput.value) || 25000;
        
        // Software checkboxes
        state.tools = [];
        document.querySelectorAll('input[name="stack-tools"]:checked').forEach(box => {
            state.tools.push(box.value);
        });

        // Toggle Gear Loader
        showRoiLoader(true);
        updateTheme(state.industry);
        
        // Trigger parallel enrichment and calculation transitions
        await Promise.all([
            enrichProspectLogo(state.url, state.company),
            new Promise(resolve => setTimeout(resolve, 550)) // guarantee visual spinner presence
        ]);
        
        executeCalculations();
        updateSolutionSummary();
        showRoiLoader(false);
        
        // Smooth scroll to ROI section automatically
        document.getElementById('roi-calculator').scrollIntoView({ behavior: 'smooth' });
    });

    // Select vertical rebrand trigger
    elements.industrySelect.addEventListener('change', (e) => {
        updateTheme(e.target.value);
    });

    // API Explorer - Widget 1: REST Countries Location Intelligence
    elements.btnRunCountries.addEventListener('click', async () => {
        const country = elements.countrySelect.value;
        toggleLoader(elements.countriesLoader, true);
        
        try {
            const result = await fetchCountryData(country);
            
            // Show telemetry
            elements.countriesTelemetry.classList.remove('hidden');
            elements.countriesTelemetry.querySelector('.telemetry-status').textContent = "200 OK";
            elements.countriesTelemetry.querySelector('.telemetry-status').style.color = "var(--success)";
            elements.countriesTelemetry.querySelector('.telemetry-time').textContent = `Response: ${result.duration}ms`;
            
            // Render widgets info
            elements.countriesSummary.classList.remove('hidden');
            elements.countryNameDisplay.textContent = result.data.name;
            elements.countryCapital.textContent = result.data.capital;
            elements.countryPopulation.textContent = isNaN(result.data.population) ? "N/A" : result.data.population.toLocaleString();
            elements.countryCurrency.textContent = result.data.currency;
            elements.countryRegion.textContent = result.data.region;

            // Render country flag asset safely
            if (result.data.flag) {
                elements.countryFlag.src = result.data.flag;
                elements.countryFlag.classList.remove('hidden');
            } else {
                elements.countryFlag.classList.add('hidden');
            }

            // Raw JSON Block (uses textContent to prevent script injection)
            elements.countriesJson.textContent = result.rawJson;
        } catch (error) {
            elements.countriesTelemetry.classList.remove('hidden');
            elements.countriesTelemetry.querySelector('.telemetry-status').textContent = "ERROR";
            elements.countriesTelemetry.querySelector('.telemetry-status').style.color = "var(--error)";
            elements.countriesTelemetry.querySelector('.telemetry-time').textContent = `Response: ${error.duration || 0}ms`;
            
            elements.countriesSummary.classList.add('hidden');
            // Clean, user-facing error message
            elements.countriesJson.textContent = `// Error: ${error.message || "Unable to fetch country data. Please try again."}`;
        } finally {
            toggleLoader(elements.countriesLoader, false);
        }
    });

    // API Explorer - Widget 2: Sync Exchange Rates
    elements.btnRunExchange.addEventListener('click', async () => {
        toggleLoader(elements.exchangeLoader, true);
        
        try {
            const result = await fetchExchangeRates();
            state.rates = result.rates;
            
            // Render Telemetry
            elements.exchangeTelemetry.classList.remove('hidden');
            elements.exchangeTelemetry.querySelector('.telemetry-status').textContent = "200 OK";
            elements.exchangeTelemetry.querySelector('.telemetry-status').style.color = "var(--success)";
            elements.exchangeTelemetry.querySelector('.telemetry-time').textContent = `Response: ${result.duration}ms`;
            
            // Raw JSON
            elements.exchangeJson.textContent = result.rawJson;
            updateExchangeRates();
        } catch (error) {
            elements.exchangeTelemetry.classList.remove('hidden');
            elements.exchangeTelemetry.querySelector('.telemetry-status').textContent = "ERROR";
            elements.exchangeTelemetry.querySelector('.telemetry-status').style.color = "var(--error)";
            elements.exchangeTelemetry.querySelector('.telemetry-time').textContent = `Response: ${error.duration || 0}ms`;
            // Safe error handler
            elements.exchangeJson.textContent = `// Error: ${error.message || "Unable to sync exchange rates. Please try again."}`;
        } finally {
            toggleLoader(elements.exchangeLoader, false);
        }
    });

    // Currency Option change event
    elements.currencySelect.addEventListener('change', () => {
        updateExchangeRates();
    });

    // API Explorer - Widget 3: CRM Simulator Contacts
    elements.btnRunCrm.addEventListener('click', async () => {
        toggleLoader(elements.crmLoader, true);
        
        try {
            const result = await fetchCrmContacts();
            
            // Show telemetry
            elements.crmTelemetry.classList.remove('hidden');
            elements.crmTelemetry.querySelector('.telemetry-status').textContent = "200 OK";
            elements.crmTelemetry.querySelector('.telemetry-status').style.color = "var(--success)";
            elements.crmTelemetry.querySelector('.telemetry-time').textContent = `Response: ${result.duration}ms`;
            
            // Fill target table layout
            const tbody = elements.crmTable.querySelector('tbody');
            tbody.innerHTML = ''; // clear initial placeholder
            
            result.contacts.slice(0, 5).forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${escapeHtml(c.name)}</strong></td>
                    <td>${escapeHtml(c.email)}</td>
                    <td><span class="badge badge-primary">${escapeHtml(c.company)}</span></td>
                `;
                tbody.appendChild(tr);
            });
        } catch (error) {
            elements.crmTelemetry.classList.remove('hidden');
            elements.crmTelemetry.querySelector('.telemetry-status').textContent = "ERROR";
            elements.crmTelemetry.querySelector('.telemetry-status').style.color = "var(--error)";
            elements.crmTelemetry.querySelector('.telemetry-time').textContent = `Response: ${error.duration || 0}ms`;
            
            const tbody = elements.crmTable.querySelector('tbody');
            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="text-center" style="color: var(--error)">
                        Connection error pulling simulator records: ${error.message}
                    </td>
                </tr>
            `;
        } finally {
            toggleLoader(elements.crmLoader, false);
        }
    });

    // Export PDF Proposal Document
    elements.btnExportPdf.addEventListener('click', () => {
        exportProposalPDF();
    });
}

/* ==========================================================================
   ROI Core Calculations (Section 2)
   ========================================================================== */
function executeCalculations() {
    const activeToolsCount = state.tools.length;

    // 1. Time Saved: Employees × 3.5hrs × 4weeks × (0.15 + (ActiveTools × 0.11))
    const weeklyWaste = 3.5;
    const timeSavedRate = 0.15 + (activeToolsCount * 0.11);
    state.calculatedROI.timeSaved = Math.round(state.employees * weeklyWaste * 4 * timeSavedRate);

    // 2. Cost Saved (Annual savings calculated in USD initially): MonthlyCost × 12 × (0.40 + (ActiveTools × 0.07))
    const costSavingMultiplier = 0.40 + (activeToolsCount * 0.07);
    state.calculatedROI.costSavedUsd = Math.round(state.monthlyCost * 12 * costSavingMultiplier);

    // 3. Productivity Boost (%): 12% + (ActiveTools × 6.5%) — capped at 85%
    const productivityBoost = 12 + (activeToolsCount * 6.5);
    state.calculatedROI.productivity = Math.min(Math.round(productivityBoost), 85);

    // 4. Payback Period (months): PlatformCost / (AnnualSavings / 12)
    // where PlatformCost = (Employees × $18 × 12) + $4800
    const platformCostUsd = (state.employees * 18 * 12) + 4800;
    const monthlySavingsUsd = state.calculatedROI.costSavedUsd / 12;
    const paybackPeriod = monthlySavingsUsd > 0 ? (platformCostUsd / monthlySavingsUsd) : 12;
    state.calculatedROI.payback = parseFloat(Math.max(paybackPeriod, 1.0).toFixed(1));

    // 5. ROI %: ((3YearSavings - 3YearCost) / 3YearCost) × 100
    const threeYearSavingsUsd = state.calculatedROI.costSavedUsd * 3;
    const threeYearCostUsd = platformCostUsd * 3;
    const roiPercentage = threeYearCostUsd > 0 ? ((threeYearSavingsUsd - threeYearCostUsd) / threeYearCostUsd) * 100 : 0;
    state.calculatedROI.roiPercent = Math.max(Math.round(roiPercentage), 0);

    // Trigger counters countdown animations
    animateMetricNumber(elements.metricTime, state.calculatedROI.timeSaved);
    animateMetricNumber(elements.metricProductivity, state.calculatedROI.productivity);
    animateMetricNumber(elements.metricPayback, state.calculatedROI.payback, true);
    animateMetricNumber(elements.metricRoi, state.calculatedROI.roiPercent);

    // Dynamic currency updates
    updateCurrencyDisplay();
}

function updateCurrencyDisplay() {
    const symbol = currencySymbols[state.currentCurrency] || "₹";
    elements.currencySymbolText.textContent = symbol;

    // Convert cost metrics using live synced exchange multipliers (base rates relative to USD)
    const activeMultiplier = state.rates[state.currentCurrency] || 83.5;
    const convertedSavings = Math.round(state.calculatedROI.costSavedUsd * activeMultiplier);

    animateMetricNumber(elements.metricCost, convertedSavings);

    // Sync Section 5 Summary Card Value Pill
    elements.summaryRoiValText.textContent = `${symbol}${convertedSavings.toLocaleString()}`;
}

function updateExchangeRates() {
    state.currentCurrency = elements.currencySelect.value;
    state.currencySymbol = currencySymbols[state.currentCurrency] || "₹";

    // Set dynamic rate indicators
    const currentRate = state.rates[state.currentCurrency] || 83.5;
    elements.currentExchangeRateText.textContent = `${currentRate.toFixed(4)} ${state.currentCurrency}`;

    updateCurrencyDisplay();
}

/* ==========================================================================
   Company Logo Enrichment Services (Section 3)
   ========================================================================== */
async function enrichProspectLogo(url, companyName) {
    toggleLoader(elements.logoLoader, true);
    
    // Telemetry timings
    elements.logoTelemetry.classList.remove('hidden');
    elements.logoTelemetry.querySelector('span:first-child').textContent = "Status: Querying";
    elements.logoTelemetry.querySelector('span:first-child').style.color = "var(--text-muted)";
    
    const domain = extractDomain(url);
    elements.logoDetailsDomain.textContent = domain;
    elements.logoDetailsName.textContent = companyName;

    try {
        const logoData = await fetchCompanyLogo(domain, companyName);

        // Render prospect image asset
        if (logoData.url) {
            elements.prospectLogoImg.src = logoData.url;
            elements.prospectLogoImg.classList.remove('hidden');
            
            // Sync Sections 5 Card Logo Frame
            elements.summaryLogoImg.src = logoData.url;
            elements.summaryLogoImg.classList.remove('hidden');
        }

        // Output Telemetry logs
        elements.logoTelemetry.querySelector('span:first-child').textContent = `Status: Synced (${logoData.source})`;
        elements.logoTelemetry.querySelector('span:first-child').style.color = "var(--success)";
        elements.logoTelemetry.querySelector('.telemetry-time').textContent = `Response: ${logoData.duration}ms`;
    } catch (error) {
        elements.prospectLogoImg.classList.add('hidden');
        elements.summaryLogoImg.classList.add('hidden');
        
        elements.logoTelemetry.querySelector('span:first-child').textContent = "Status: Fetch Error";
        elements.logoTelemetry.querySelector('span:first-child').style.color = "var(--error)";
        elements.logoTelemetry.querySelector('.telemetry-time').textContent = `Response: ${error.duration || 0}ms`;
    } finally {
        toggleLoader(elements.logoLoader, false);
    }
}

/* ==========================================================================
   Solution Summary Card Rendering (Section 5)
   ========================================================================== */
function updateSolutionSummary() {
    const profile = industryProfiles[state.industry];
    
    elements.summaryCompanyTitle.textContent = state.company;
    elements.summaryIndustryTag.textContent = `${profile.name} Integration`;
    elements.summaryEmployeeScale.textContent = `${state.employees.toLocaleString()} Employees`;
    
    // Sync tool stack integrations
    elements.summaryIntegrationScope.textContent = state.tools.length > 0 ? state.tools.join(', ') : "None Configured";

    // Personalized presales sales-pitch narrative copy
    const narrativeText = `Based on <strong>${escapeHtml(state.company)}</strong>'s profile in <strong>${profile.name}</strong> with <strong>${state.employees.toLocaleString()}</strong> employees, here is how our solution maps to your key challenges: ${profile.text}`;
    elements.summaryNarrative.innerHTML = narrativeText;

    // Output pain point list structures
    elements.summaryChallenges.innerHTML = '';
    profile.challenges.forEach(c => {
        const li = document.createElement('li');
        li.textContent = c;
        elements.summaryChallenges.appendChild(li);
    });

    // Output dynamic resolutions lists
    elements.summarySolutions.innerHTML = '';
    profile.solutions.forEach(s => {
        const li = document.createElement('li');
        li.textContent = s;
        elements.summarySolutions.appendChild(li);
    });
}

/* ==========================================================================
   Helper Utilities
   ========================================================================== */
function updateTheme(industry) {
    document.body.className = '';
    const profile = industryProfiles[industry];
    if (profile && profile.themeClass) {
        document.body.classList.add(profile.themeClass);
    }
}

function showRoiLoader(show) {
    if (show) {
        elements.roiLoader.classList.remove('hidden');
    } else {
        elements.roiLoader.classList.add('hidden');
    }
}

function toggleLoader(loaderElement, show) {
    if (show) {
        loaderElement.classList.remove('hidden');
    } else {
        loaderElement.classList.add('hidden');
    }
}

/**
 * Animated number counter leveraging requestAnimationFrame metrics.
 */
function animateMetricNumber(targetElement, targetVal, isFloat = false) {
    const duration = 800; // Counter timing run length
    const startTime = performance.now();
    const startVal = 0;

    function count(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        const currentVal = startVal + progress * (targetVal - startVal);
        
        if (isFloat) {
            targetElement.textContent = currentVal.toFixed(1);
        } else {
            targetElement.textContent = Math.floor(currentVal).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(count);
        } else {
            // Force final precision bounds
            if (isFloat) {
                targetElement.textContent = targetVal.toFixed(1);
            } else {
                targetElement.textContent = targetVal.toLocaleString();
            }
        }
    }

    requestAnimationFrame(count);
}

function extractDomain(url) {
    let clean = url.trim();
    if (!/^https?:\/\//i.test(clean)) {
        clean = 'http://' + clean;
    }
    try {
        const parsed = new URL(clean);
        return parsed.hostname;
    } catch (e) {
        return "stripe.com";
    }
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

/* ==========================================================================
   Client-Side PDF Document Builder (jsPDF Integration)
   ========================================================================== */
function exportProposalPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const profile = industryProfiles[state.industry];
    const conversionRate = state.rates[state.currentCurrency] || 83.5;
    const convertedSavings = Math.round(state.calculatedROI.costSavedUsd * conversionRate);
    const savingsText = `${state.currencySymbol}${convertedSavings.toLocaleString()} ${state.currentCurrency}`;

    const leftMargin = 20;
    let currentY = 25;

    // 1. Executive styling Header panel
    doc.setFillColor(11, 15, 25); // Slate deep base color
    doc.rect(0, 0, 210, 48, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("DemoCraft Value Proposal", leftMargin, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`PREPARED FOR: ${state.company.toUpperCase()}`, leftMargin, 30);
    doc.text(`BUSINESS ARCHITECTURE: ${profile.name.toUpperCase()}`, leftMargin, 36);

    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Proposal Synced: ${dateStr} | Selected Local Base: ${state.currentCurrency}`, 120, 36);

    currentY = 58;

    // 2. Projected Financial ROI metrics table grid
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Key Business Value Projections", leftMargin, currentY);
    currentY += 8;

    // Outline metrics bounding box
    doc.setDrawColor(225, 225, 225);
    doc.setFillColor(248, 250, 252);
    doc.rect(leftMargin, currentY, 170, 34, 'F');
    doc.rect(leftMargin, currentY, 170, 34);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);

    // Table metric column headers
    doc.text("Time Saved / Mo", leftMargin + 5, currentY + 10);
    doc.text("Annual Cost Savings", leftMargin + 45, currentY + 10);
    doc.text("Productivity Gain", leftMargin + 95, currentY + 10);
    doc.text("Payback Period", leftMargin + 135, currentY + 10);

    // Value metrics row
    doc.setTextColor(11, 15, 25);
    doc.setFontSize(12);
    doc.text(`${state.calculatedROI.timeSaved} hrs`, leftMargin + 5, currentY + 22);
    doc.text(savingsText, leftMargin + 45, currentY + 22);
    doc.text(`${state.calculatedROI.productivity}%`, leftMargin + 95, currentY + 22);
    doc.text(`${state.calculatedROI.payback} mos`, leftMargin + 135, currentY + 22);

    currentY += 48;

    // 3. Technical discovery alignment narrative
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("GTM Value Alignment Summary", leftMargin, currentY);
    currentY += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);

    const fullNarrative = `Based on ${state.company}'s vertical profile in ${profile.name} with ${state.employees.toLocaleString()} active employees, our platform unifies integrations and automates legacy pipelines. Connecting your stack (${state.tools.join(', ')}) to our core gateway solves critical business challenges, delivering continuous operations.`;
    const splitText = doc.splitTextToSize(fullNarrative, 170);
    doc.text(splitText, leftMargin, currentY);
    
    currentY += splitText.length * 5 + 10;

    // 4. Detailed Technical Discovery Matrix mapping
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(11, 15, 25);
    doc.text("Detailed Discovery Assessment Mapping", leftMargin, currentY);
    currentY += 10;

    // Pain point headers
    doc.setFontSize(11);
    doc.text("Identified Challenges", leftMargin, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(150, 40, 40);

    let leftY = currentY + 6;
    profile.challenges.forEach(c => {
        const textBlock = doc.splitTextToSize(`- ${c}`, 80);
        doc.text(textBlock, leftMargin, leftY);
        leftY += textBlock.length * 5 + 2;
    });

    // Technical Resolutions headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(11, 15, 25);
    doc.text("Proposed Architectures", leftMargin + 90, currentY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(16, 120, 80);

    let rightY = currentY + 6;
    profile.solutions.forEach(s => {
        const textBlock = doc.splitTextToSize(`- ${s}`, 80);
        doc.text(textBlock, leftMargin + 90, rightY);
        rightY += textBlock.length * 5 + 2;
    });

    currentY = Math.max(leftY, rightY) + 15;

    // 5. Institutional Footer specs
    doc.setDrawColor(240, 240, 240);
    doc.line(leftMargin, currentY, 190, currentY);
    currentY += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8.5);
    doc.setTextColor(120, 120, 120);
    doc.text(`Solutions Architect Integration: ${state.tools.join(', ')} | Projected ROI: ${state.calculatedROI.roiPercent}%`, leftMargin, currentY);
    doc.text("DemoCraft Solutions Portfolio | Client GTM Enablement Team", leftMargin, currentY + 5);

    // Save final document compilation
    doc.save(`democraft-value-proposal-${state.company.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

/* ==========================================================================
   Scroll Spy Link Tracker
   ========================================================================== */
function setupScrollSpy() {
    const sections = document.querySelectorAll('section.section');
    const links = document.querySelectorAll('.nav-links a');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const activeId = entry.target.getAttribute('id');
                links.forEach(l => {
                    l.classList.remove('active');
                    if (l.getAttribute('href') === `#${activeId}`) {
                        l.classList.add('active');
                    }
                });
            }
        });
    }, {
        root: null,
        rootMargin: '-30% 0px -50% 0px',
        threshold: 0
    });

    sections.forEach(s => observer.observe(s));
}
