// Basic core application state (without external APIs)
const state = {
    company: "Acme Corp",
    vertical: "fintech",
    employees: 250,
    monthlyCost: 25000,
    tools: ["Salesforce", "Jira"],
    rates: { INR: 83.5, USD: 1.0 },
    currentCurrency: "INR",
    currencySymbol: "₹"
};

function calculateROI() {
    const timeSaved = state.tools.length * 12;
    const annualSavings = state.monthlyCost * 12 * 0.35 * state.rates[state.currentCurrency];
    console.log(`Calculating values: Time Saved = ${timeSaved} hrs, Cost Savings = ${state.currencySymbol}${annualSavings}`);
}
calculateROI();
