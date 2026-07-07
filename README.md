# DemoCraft ⚡ Enterprise ROI & Demo Configurator

[![Live Demo](https://img.shields.io/badge/Live-Demo-blue)](https://democraft-se.vercel.app)

DemoCraft is a high-fidelity, interactive, and visually stunning web application designed specifically for a **Solutions Engineer (SE) / Presales & Go-To-Market (GTM)** portfolio. It demonstrates how a technical sales professional can bridge complex engineering concepts with high-value business outcomes.

Built with pure, production-ready **Vanilla HTML5, CSS3, and JavaScript (ES6)**, the application requires **zero compilation steps or npm package installs**, loading instantly directly from the local file system.

---

## 🌟 Why This Project Impresses in Solutions Engineering Interviews

Solutions Engineering lies at the intersection of **technical depth** and **commercial storytelling**. DemoCraft models the exact challenges a pre-sales engineer solves daily:

1. **Discovery & Custom Demos**: Dynamic vertical rebranding (FinTech, E-Commerce, Healthcare, SaaS) that updates theme assets, currencies, business pain points, and technical solutions on-the-fly.
2. **Value-Based Selling**: A live ROI calculator projecting time reclaimed, cost savings, payback timelines, and 3-year cumulative returns, allowing business buyers to see immediate financial impact.
3. **Data Enrichment & Personalization**: Live lookup of prospect brand marks using their website domain, turning a generic demo into a personalized workspace.
4. **Integration Engineering**: A sandbox exposing real REST API request/response JSON payloads, auth headers, and execution latency, proving to developers that you can "talk APIs."

---

## 🏗️ Technical Architecture

```mermaid
graph TD
    A[SE Configurator Form] -->|1. Submit Input Parameters| B[Core Application State]
    B -->|2. Domain URL| C[Logo.dev API]
    B -->|3. Selected Currency| D[Exchange Rate API]
    B -->|4. Selected Country| E[REST Countries API via CORS Proxy]
    B -->|5. Simulation Request| F[JSONPlaceholder CRM API]
    
    C -->|Response Time & Logo URL| G[Dynamic Solutions Dashboard]
    D -->|Active Conversion Multipliers| G
    E -->|Prospect Location Intelligence JSON| G
    F -->|CRM Contacts Simulator Schema| G
    
    G -->|Value Projections & Architecture Mapping| H[Client Value Proposal PDF]
```

---

## 🔌 Real Public APIs Integrated (No Mocks)

| Service | API Endpoint | GTM Use Case | Technical Core |
| :--- | :--- | :--- | :--- |
| **Logo.dev API** | `https://img.logo.dev/{domain}?token={token}` | Prospect brand identification & customized UI personalization. | Client-side Image asset load profiling & CORS bypass. |
| **REST Countries** | `https://corsproxy.io/?https://restcountries.com/v3.1/name/{country}` | Location market intelligence, regional routing, and local compliance checks. | Secure CORS proxy tunnel with AllOrigins failover fallback. |
| **Exchange Rates** | `https://open.er-api.com/v6/latest/USD` | Global pricing adjustment, converting value matrices to prospects' local currencies. | Synchronized CORS-enabled endpoints, rate mapping, real-time math conversions. |
| **JSONPlaceholder** | `https://jsonplaceholder.typicode.com/users` | CRM Contacts integration preview, simulating active lead synchronization. | REST collection ingestion, dynamic HTML Table generation. |

---

## 🛠️ Key Product Features

*   **Responsive Glassmorphic UI**: Designed with a premium dark theme (`Plus Jakarta Sans` typography, backdrop blur filters, glowing border frames, custom scrollbars).
*   **Response Time Telemetry**: Displays the actual round-trip latency in milliseconds next to each API execution, showcasing technical depth.
*   **Dynamic Rebranding CSS Custom Variables**: Swapping target verticals adjusts core color schemes (emerald for FinTech, cyan for Healthcare, violet/pink for E-Commerce, blue/indigo for SaaS) and copy sets.
*   **Animated Counter Projections**: Value statistics count up from 0 to the calculated target dynamically using unified animation frame loops.
*   **Executive PDF Export**: Generates and compiles a complete business case proposal PDF dynamically in the browser (using client-side **jsPDF** modules) for stakeholders to download.

---

## 🚀 Execution and Production Deployment

### Local Execution (Zero Setup)
Simply open the `index.html` file in any modern web browser. The application is completely serverless and runs natively on the client side with zero dependencies, avoiding complex build or module systems.

### Production Hosting (Vercel Deployment)
For customer-facing presentations, the configurator is optimized for deployment on Vercel:
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Click **Add New Project** and import the `enterprise-roi-configurator` repository.
3. Click **Deploy**. Vercel will automatically identify the project as a static website and host it globally with a custom domains link.
