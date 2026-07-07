/**
 * ==========================================================================
 * DemoCraft API Integration Services (api.js)
 * Coordinates all direct HTTP REST fetches and load telemetries.
 * Production-ready, asynchronous helper methods with response-time logging.
 * ==========================================================================
 */

// Enterprise Logo API Key (Publishable Key prefixed with pk_)
// Sign up at https://logo.dev/ to obtain your own free-tier API token.
const LOGODEV_TOKEN = "pk_XgI_44vwRqeHzTwjrzT-rg";

// Rate limiting variables
let lastCountryApiCall = 0;
let lastExchangeApiCall = 0;
const RATE_LIMIT_MS = 2000;

/**
 * Sanitizes input string to prevent script injection and command errors.
 * Only allows letters, spaces, and hyphens. Caps length at 50 chars.
 * 
 * @param {string} input 
 * @returns {string}
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z\s\-]/g, '').trim().substring(0, 50);
}

/**
 * Executes a fetch request with a specified timeout using AbortController.
 * 
 * @param {string} resource 
 * @param {Object} options 
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 3000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/**
 * Enriches prospect brand logo by checking website domains.
 * First targets the Logo.dev CDN API. If it resolves, returns the logo URL.
 * If Logo.dev fails, is unauthorized, or domain is invalid, falls back to UI Avatars.
 * Uses Image object load listeners to compute round-trip latency.
 * 
 * @param {string} domain - Website URL or domain string (e.g. stripe.com)
 * @param {string} companyName - Company name fallback for UI Avatars
 * @returns {Promise<{url: string, duration: number, source: string}>}
 */
async function fetchCompanyLogo(domain, companyName) {
    // Sanitize parameters
    const sanitizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].replace(/[^a-zA-Z0-9.\-]/g, '').substring(0, 100);
    const sanitizedCompany = sanitizeInput(companyName);
    
    const logoUrl = `https://img.logo.dev/${sanitizedDomain}?token=${LOGODEV_TOKEN}`;
    const startTime = performance.now();

    return new Promise((resolve) => {
        const tempImage = new Image();

        tempImage.onload = () => {
            const duration = Math.round(performance.now() - startTime);
            resolve({
                url: logoUrl,
                duration: duration,
                source: "Logo.dev API"
            });
        };

        tempImage.onerror = () => {
            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedCompany)}&background=3b82f6&color=fff`;
            const fallbackImage = new Image();

            fallbackImage.onload = () => {
                const duration = Math.round(performance.now() - startTime);
                resolve({
                    url: fallbackUrl,
                    duration: duration,
                    source: "UI Avatars Fallback"
                });
            };

            fallbackImage.onerror = () => {
                const duration = Math.round(performance.now() - startTime);
                resolve({
                    url: "",
                    duration: duration,
                    source: "Enrichment Failed"
                });
            };

            fallbackImage.src = fallbackUrl;
        };

        tempImage.src = logoUrl;
    });
}

/**
 * Normalizes, whitelists, and structures API response values securely.
 * 
 * @param {Object} countryObj 
 * @param {number} startTime 
 * @returns {Object}
 */
function parseAndFormatCountry(countryObj, startTime) {
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // Whitelist extraction (Content Security)
    const name = countryObj.name && typeof countryObj.name.common === 'string' ? countryObj.name.common : 
                 (typeof countryObj.name === 'string' ? countryObj.name : 'N/A');
    
    const capital = countryObj.capital && Array.isArray(countryObj.capital) && countryObj.capital.length > 0 ? countryObj.capital[0] : 
                    (typeof countryObj.capital === 'string' ? countryObj.capital : 'N/A');
    
    const population = typeof countryObj.population === 'number' ? countryObj.population : 
                       (typeof countryObj.population === 'string' ? parseInt(countryObj.population.replace(/,/g, '')) : NaN);
    
    const region = typeof countryObj.region === 'string' ? countryObj.region : 'N/A';
    
    let currencyStr = "N/A";
    if (countryObj.currencies) {
        if (typeof countryObj.currencies === 'object') {
            const keys = Object.keys(countryObj.currencies);
            if (keys.length > 0) {
                const firstKey = keys[0];
                const currObj = countryObj.currencies[firstKey];
                if (currObj && typeof currObj === 'object') {
                    const cName = typeof currObj.name === 'string' ? currObj.name : firstKey;
                    const symbol = typeof currObj.symbol === 'string' ? currObj.symbol : '';
                    currencyStr = symbol ? `${cName} (${symbol})` : cName;
                }
            }
        }
    }

    const flagUrl = countryObj.flags && typeof countryObj.flags.svg === 'string' && countryObj.flags.svg.startsWith('https://') ? countryObj.flags.svg : 
                    (typeof countryObj.flag === 'string' && countryObj.flag.startsWith('https://') ? countryObj.flag : '');

    const safeJson = {
        name: { common: name },
        capital: [capital],
        population: population,
        region: region,
        currencies: countryObj.currencies || {},
        flags: { svg: flagUrl }
    };

    return {
        data: {
            name: name,
            capital: capital,
            population: population,
            region: region,
            currency: currencyStr,
            flag: flagUrl
        },
        rawJson: JSON.stringify(safeJson, null, 2),
        duration: duration
    };
}

/**
 * Query REST Countries API to fetch location intelligence.
 * Utilizes primary and secondary CORS proxies as requested.
 * Automatically fails over to a local curated database to guarantee 100% operational
 * demos when public proxies time out or when restcountries.com returns deprecation blocks.
 * 
 * @param {string} countryName - The name or search query for the country
 * @returns {Promise<{data: Object, rawJson: string, duration: number}>}
 */
async function fetchCountryData(countryName) {
    // Rate limit check
    if (Date.now() - lastCountryApiCall < RATE_LIMIT_MS) {
        throw new Error('Please wait before making another request');
    }
    lastCountryApiCall = Date.now();

    // Input sanitization
    const sanitizedCountry = sanitizeInput(countryName);
    if (!sanitizedCountry) {
        throw new Error('Invalid country name input');
    }

    const cleanKey = sanitizedCountry.toLowerCase();
    const startTime = performance.now();
    
    // Requested proxy-based endpoints pointing to restcountries.com
    const primaryEndpoint = `https://corsproxy.io/?https://restcountries.com/v3.1/name/${encodeURIComponent(sanitizedCountry)}`;
    const fallbackEndpoint = `https://api.allorigins.win/get?url=${encodeURIComponent('https://restcountries.com/v3.1/name/' + sanitizedCountry)}`;

    let data = null;

    // Curated failover database covering all 20 select dropdown options
    const localCountries = {
        "india": {
            name: { common: "India" },
            capital: ["New Delhi"],
            population: 1380004385,
            region: "Asia",
            currencies: { INR: { name: "Indian Rupee", symbol: "₹" } },
            flags: { svg: "https://flagcdn.com/in.svg" }
        },
        "united states": {
            name: { common: "United States" },
            capital: ["Washington, D.C."],
            population: 331002651,
            region: "Americas",
            currencies: { USD: { name: "United States Dollar", symbol: "$" } },
            flags: { svg: "https://flagcdn.com/us.svg" }
        },
        "germany": {
            name: { common: "Germany" },
            capital: ["Berlin"],
            population: 83783942,
            region: "Europe",
            currencies: { EUR: { name: "Euro", symbol: "€" } },
            flags: { svg: "https://flagcdn.com/de.svg" }
        },
        "united kingdom": {
            name: { common: "United Kingdom" },
            capital: ["London"],
            population: 67886011,
            region: "Europe",
            currencies: { GBP: { name: "British Pound", symbol: "£" } },
            flags: { svg: "https://flagcdn.com/gb.svg" }
        },
        "singapore": {
            name: { common: "Singapore" },
            capital: ["Singapore"],
            population: 5850342,
            region: "Asia",
            currencies: { SGD: { name: "Singapore Dollar", symbol: "S$" } },
            flags: { svg: "https://flagcdn.com/sg.svg" }
        },
        "australia": {
            name: { common: "Australia" },
            capital: ["Canberra"],
            population: 25499884,
            region: "Oceania",
            currencies: { AUD: { name: "Australian Dollar", symbol: "A$" } },
            flags: { svg: "https://flagcdn.com/au.svg" }
        },
        "japan": {
            name: { common: "Japan" },
            capital: ["Tokyo"],
            population: 126476461,
            region: "Asia",
            currencies: { JPY: { name: "Japanese Yen", symbol: "¥" } },
            flags: { svg: "https://flagcdn.com/jp.svg" }
        },
        "united arab emirates": {
            name: { common: "United Arab Emirates" },
            capital: ["Abu Dhabi"],
            population: 9890402,
            region: "Asia",
            currencies: { AED: { name: "UAE Dirham", symbol: "د.إ" } },
            flags: { svg: "https://flagcdn.com/ae.svg" }
        },
        "canada": {
            name: { common: "Canada" },
            capital: ["Ottawa"],
            population: 37742154,
            region: "Americas",
            currencies: { CAD: { name: "Canadian Dollar", symbol: "C$" } },
            flags: { svg: "https://flagcdn.com/ca.svg" }
        },
        "france": {
            name: { common: "France" },
            capital: ["Paris"],
            population: 65273511,
            region: "Europe",
            currencies: { EUR: { name: "Euro", symbol: "€" } },
            flags: { svg: "https://flagcdn.com/fr.svg" }
        },
        "brazil": {
            name: { common: "Brazil" },
            capital: ["Brasília"],
            population: 212559417,
            region: "Americas",
            currencies: { BRL: { name: "Brazilian Real", symbol: "R$" } },
            flags: { svg: "https://flagcdn.com/br.svg" }
        },
        "south africa": {
            name: { common: "South Africa" },
            capital: ["Pretoria"],
            population: 59308690,
            region: "Africa",
            currencies: { ZAR: { name: "South African Rand", symbol: "R" } },
            flags: { svg: "https://flagcdn.com/za.svg" }
        },
        "china": {
            name: { common: "China" },
            capital: ["Beijing"],
            population: 1402112000,
            region: "Asia",
            currencies: { CNY: { name: "Chinese Yuan", symbol: "¥" } },
            flags: { svg: "https://flagcdn.com/cn.svg" }
        },
        "saudi arabia": {
            name: { common: "Saudi Arabia" },
            capital: ["Riyadh"],
            population: 34813871,
            region: "Asia",
            currencies: { SAR: { name: "Saudi Riyal", symbol: "﷼" } },
            flags: { svg: "https://flagcdn.com/sa.svg" }
        },
        "netherlands": {
            name: { common: "Netherlands" },
            capital: ["Amsterdam"],
            population: 17134872,
            region: "Europe",
            currencies: { EUR: { name: "Euro", symbol: "€" } },
            flags: { svg: "https://flagcdn.com/nl.svg" }
        },
        "sweden": {
            name: { common: "Sweden" },
            capital: ["Stockholm"],
            population: 10099265,
            region: "Europe",
            currencies: { SEK: { name: "Swedish Krona", symbol: "kr" } },
            flags: { svg: "https://flagcdn.com/se.svg" }
        },
        "mexico": {
            name: { common: "Mexico" },
            capital: ["Mexico City"],
            population: 128932753,
            region: "Americas",
            currencies: { MXN: { name: "Mexican Peso", symbol: "$" } },
            flags: { svg: "https://flagcdn.com/mx.svg" }
        },
        "south korea": {
            name: { common: "South Korea" },
            capital: ["Seoul"],
            population: 51269185,
            region: "Asia",
            currencies: { KRW: { name: "South Korean Won", symbol: "₩" } },
            flags: { svg: "https://flagcdn.com/kr.svg" }
        },
        "italy": {
            name: { common: "Italy" },
            capital: ["Rome"],
            population: 60461826,
            region: "Europe",
            currencies: { EUR: { name: "Euro", symbol: "€" } },
            flags: { svg: "https://flagcdn.com/it.svg" }
        },
        "new zealand": {
            name: { common: "New Zealand" },
            capital: ["Wellington"],
            population: 4822233,
            region: "Oceania",
            currencies: { NZD: { name: "New Zealand Dollar", symbol: "NZ$" } },
            flags: { svg: "https://flagcdn.com/nz.svg" }
        }
    };

    try {
        try {
            // 1. Attempt primary proxy fetch with 3-second timeout
            const response = await fetchWithTimeout(primaryEndpoint, { timeout: 3000 });
            if (!response.ok) {
                throw new Error(`Primary CORS proxy returned status ${response.status}`);
            }
            data = await response.json();
        } catch (primaryError) {
            console.warn("Primary CORS proxy failed or timed out, trying secondary proxy...", primaryError);
            // 2. Attempt secondary proxy fetch with 4-second timeout
            const response = await fetchWithTimeout(fallbackEndpoint, { timeout: 4000 });
            if (!response.ok) {
                throw new Error(`Secondary CORS proxy returned status ${response.status}`);
            }
            const wrapper = await response.json();
            data = JSON.parse(wrapper.contents);
        }

        // Response validation - check if it's a non-empty array and not a deprecation error
        const countryList = Array.isArray(data) ? data : (data ? [data] : []);
        if (countryList.length === 0 || (countryList[0] && countryList[0].success === false)) {
            throw new Error('Invalid response from API or legacy version deprecated');
        }

        const countryObj = countryList[0];
        return parseAndFormatCountry(countryObj, startTime);

    } catch (error) {
        console.warn("REST Countries CORS proxy failed. Utilizing local curated cache failover.", error);
        
        const localData = localCountries[cleanKey];
        if (localData) {
            return parseAndFormatCountry(localData, startTime);
        }

        // Standard clean error display without exposing internals
        console.error('API Error:', error);
        throw {
            message: 'Unable to fetch country data. Please try again.',
            duration: Math.round(performance.now() - startTime)
        };
    }
}

/**
 * Syncs USD exchange rates to enable multi-currency conversions on ROI results.
 * Implements rate limiting and strict response validation.
 * 
 * @returns {Promise<{rates: Object, rawJson: string, duration: number}>}
 */
async function fetchExchangeRates() {
    // Rate limit check
    if (Date.now() - lastExchangeApiCall < RATE_LIMIT_MS) {
        throw new Error('Please wait before making another request');
    }
    lastExchangeApiCall = Date.now();

    const startTime = performance.now();
    const endpoint = 'https://open.er-api.com/v6/latest/USD';

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`Exchange Rate API returned status ${response.status}`);
        }

        const rawData = await response.json();
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        // Response validation
        if (!rawData || !rawData.rates || typeof rawData.rates !== 'object') {
            throw new Error('Invalid response from Exchange Rates API');
        }

        // Validate all rates are actual numeric values
        const sanitizedRates = {};
        for (const key in rawData.rates) {
            const sanitizedKey = key.replace(/[^A-Z]/g, '').substring(0, 3);
            if (sanitizedKey.length === 3 && typeof rawData.rates[key] === 'number') {
                sanitizedRates[sanitizedKey] = rawData.rates[key];
            }
        }

        return {
            rates: sanitizedRates,
            rawJson: JSON.stringify({
                result: "success",
                base_code: "USD",
                rates: sanitizedRates
            }, null, 2),
            duration: duration
        };
    } catch (error) {
        console.error('API Error:', error);
        throw {
            message: 'Unable to sync exchange rates. Please try again.',
            duration: Math.round(performance.now() - startTime)
        };
    }
}

/**
 * Fetches user records from JSONPlaceholder to simulate active CRM syncing.
 * 
 * @returns {Promise<{contacts: Array<Object>, duration: number}>}
 */
async function fetchCrmContacts() {
    const startTime = performance.now();
    const endpoint = 'https://jsonplaceholder.typicode.com/users';

    try {
        const response = await fetch(endpoint);
        if (!response.ok) {
            throw new Error(`CRM API returned status ${response.status}`);
        }

        const rawContacts = await response.json();
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);

        if (!Array.isArray(rawContacts)) {
            throw new Error('Invalid CRM response data');
        }

        // Format contacts matching Section 4 table layout
        const formatted = rawContacts.map(c => {
            const name = typeof c.name === 'string' ? c.name : 'N/A';
            const email = typeof c.email === 'string' ? c.email : 'N/A';
            const companyName = c.company && typeof c.company.name === 'string' ? c.company.name : 'N/A';
            return {
                name: name.replace(/[<>]/g, ''),
                email: email.replace(/[<>]/g, ''),
                company: companyName.replace(/[<>]/g, '')
            };
        });

        return {
            contacts: formatted,
            duration: duration
        };
    } catch (error) {
        console.error('API Error:', error);
        throw {
            message: 'Unable to pull CRM contacts. Please try again.',
            duration: Math.round(performance.now() - startTime)
        };
    }
}
