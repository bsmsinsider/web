/*
* Copyright © 2026 BSMS Insider. 
* All rights reserved.
*/

(() => {
    "use strict";

    /* -----------------------------------------------------------------------
       Configuration
       ----------------------------------------------------------------------- */

    const CONFIG = Object.freeze({
        campus: {
            latitude: 35.06512,
            longitude: -82.00700
        },
        weatherEndpoint: "https://api.open-meteo.com/v1/forecast"
    });

    const SELECTORS = Object.freeze({
        page: ".page",
        navigationLink: ".navigation-link",
        pageControl: "[data-page]",
        year: "#current-year",
        temperature: "#temperature",
        condition: "#weather-condition",
        windSpeed: "#wind-speed",
        weatherIcon: "#weather-icon"
    });


    /* -----------------------------------------------------------------------
       Icon rendering
       ----------------------------------------------------------------------- */

    function renderIcons() {
        if (window.feather) {
            window.feather.replace();
        }
    }


    /* -----------------------------------------------------------------------
       Footer
       ----------------------------------------------------------------------- */

    function updateFooterYear() {
        const yearElement = document.querySelector(SELECTORS.year);

        if (yearElement) {
            yearElement.textContent = new Date().getFullYear();
        }
    }


    /* -----------------------------------------------------------------------
       Single-page navigation
       ----------------------------------------------------------------------- */

    function showPage(pageId) {
        const targetPage = document.getElementById(pageId);

        if (!targetPage || !targetPage.classList.contains("page")) {
            return;
        }

        document.querySelectorAll(SELECTORS.page).forEach(page => {
            const isActive = page === targetPage;

            page.classList.toggle("is-active", isActive);
            page.hidden = !isActive;
        });

        document.querySelectorAll(SELECTORS.navigationLink).forEach(link => {
            const isActive = link.dataset.page === pageId;

            link.classList.toggle("is-active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });

        window.scrollTo({
            top: 0,
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
                ? "auto"
                : "smooth"
        });
    }

    function initializeNavigation() {
        document.querySelectorAll(SELECTORS.pageControl).forEach(control => {
            control.addEventListener("click", event => {
                const pageId = control.dataset.page;

                if (!pageId) {
                    return;
                }

                event.preventDefault();
                showPage(pageId);
            });
        });
    }


    /* -----------------------------------------------------------------------
       Weather
       ----------------------------------------------------------------------- */

    function getWeatherDescription(code) {
        if (code === 0) {
            return { icon: "sun", label: "Clear Skies" };
        }

        if (code >= 1 && code <= 3) {
            return { icon: "cloud", label: "Partly Cloudy" };
        }

        if (code >= 45 && code <= 48) {
            return { icon: "align-justify", label: "Foggy" };
        }

        if (code >= 51 && code <= 67) {
            return { icon: "cloud-drizzle", label: "Raining" };
        }

        if (code >= 71 && code <= 77) {
            return { icon: "cloud-snow", label: "Snowing" };
        }

        if (code >= 80 && code <= 82) {
            return { icon: "cloud-rain", label: "Heavy Rain" };
        }

        if (code >= 95 && code <= 99) {
            return { icon: "cloud-lightning", label: "Thunderstorms" };
        }

        return { icon: "cloud", label: "Fair" };
    }

    function updateWeatherDisplay({ temperature, windSpeed, description }) {
        const temperatureElement = document.querySelector(SELECTORS.temperature);
        const conditionElement = document.querySelector(SELECTORS.condition);
        const windElement = document.querySelector(SELECTORS.windSpeed);
        const iconElement = document.querySelector(SELECTORS.weatherIcon);

        if (!temperatureElement || !conditionElement || !windElement || !iconElement) {
            return;
        }

        temperatureElement.textContent = `${temperature}°`;
        conditionElement.textContent = description.label;
        windElement.textContent = windSpeed;

        iconElement.setAttribute("data-feather", description.icon);
        renderIcons();
    }

    function showWeatherUnavailable() {
        const temperatureElement = document.querySelector(SELECTORS.temperature);
        const conditionElement = document.querySelector(SELECTORS.condition);
        const windElement = document.querySelector(SELECTORS.windSpeed);

        if (temperatureElement) {
            temperatureElement.textContent = "--°";
        }

        if (conditionElement) {
            conditionElement.textContent = "Weather unavailable";
        }

        if (windElement) {
            windElement.textContent = "--";
        }
    }

    async function loadCampusWeather() {
        const { latitude, longitude } = CONFIG.campus;

        const parameters = new URLSearchParams({
            latitude: latitude.toString(),
            longitude: longitude.toString(),
            current: "temperature_2m,wind_speed_10m,weather_code"
        });

        try {
            const response = await fetch(
                `${CONFIG.weatherEndpoint}?${parameters.toString()}`
            );

            if (!response.ok) {
                throw new Error(`Weather service returned HTTP ${response.status}`);
            }

            const data = await response.json();
            const current = data.current;

            if (
                !current ||
                !Number.isFinite(Number(current.temperature_2m)) ||
                !Number.isFinite(Number(current.wind_speed_10m)) ||
                !Number.isFinite(Number(current.weather_code))
            ) {
                throw new Error("Weather service returned incomplete data");
            }

            const temperatureFahrenheit = Math.round(
                (Number(current.temperature_2m) * 9 / 5) + 32
            );

            const windSpeedMph = Math.round(
                Number(current.wind_speed_10m) * 0.621371
            );

            updateWeatherDisplay({
                temperature: temperatureFahrenheit,
                windSpeed: windSpeedMph,
                description: getWeatherDescription(Number(current.weather_code))
            });
        } catch (error) {
            console.error("[BSMS Insider] Unable to load campus weather:", error);
            showWeatherUnavailable();
        }
    }


    /* -----------------------------------------------------------------------
       Application initialization
       ----------------------------------------------------------------------- */

    function initializeHomepage() {
        renderIcons();
        updateFooterYear();
        initializeNavigation();
        loadCampusWeather();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeHomepage, { once: true });
    } else {
        initializeHomepage();
    }
})();
