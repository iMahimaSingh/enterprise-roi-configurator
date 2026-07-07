const LOGODEV_TOKEN = "pk_XgI_44vwRqeHzTwjrzT-rg";

async function fetchCompanyLogo(domain, companyName) {
    const sanitizedDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, '');
    const logoUrl = `https://img.logo.dev/${sanitizedDomain}?token=${LOGODEV_TOKEN}`;
    return { url: logoUrl, source: "Logo.dev API" };
}
