document.addEventListener("DOMContentLoaded", () => {
    const header = document.getElementById("header");
    const hamburger = document.getElementById("hamburger");
    const navLinks = document.getElementById("nav-links");
    const navItems = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section[id]");
    const revealItems = document.querySelectorAll(".reveal");
    const pageLoader = document.getElementById("page-loader");

    // Loader
    window.addEventListener("load", () => {
        if (pageLoader) {
            pageLoader.classList.add("hidden");
        }
    });

    // Sticky header styling on scroll
    const handleHeaderScroll = () => {
        if (!header) return;

        if (window.scrollY > 20) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    };

    handleHeaderScroll();
    window.addEventListener("scroll", handleHeaderScroll);

    // Mobile menu toggle
    const closeMobileMenu = () => {
        if (!navLinks || !hamburger) return;
        navLinks.classList.remove("active");
        hamburger.classList.remove("is-active");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
    };

    const openMobileMenu = () => {
        if (!navLinks || !hamburger) return;
        navLinks.classList.add("active");
        hamburger.classList.add("is-active");
        hamburger.setAttribute("aria-expanded", "true");
        document.body.style.overflow = "hidden";
    };

    if (hamburger) {
        hamburger.addEventListener("click", () => {
            const isActive = navLinks.classList.contains("active");

            if (isActive) {
                closeMobileMenu();
            } else {
                openMobileMenu();
            }
        });
    }

    // Close mobile menu after clicking a nav link
    navItems.forEach((item) => {
        item.addEventListener("click", () => {
            closeMobileMenu();
        });
    });

    // Close mobile menu when resizing to desktop
    window.addEventListener("resize", () => {
        if (window.innerWidth > 860) {
            closeMobileMenu();
        }
    });

    // Active nav link highlight on scroll
    const setActiveNav = () => {
        let currentSectionId = "";

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (window.scrollY >= sectionTop - 160 && window.scrollY < sectionTop + sectionHeight - 160) {
                currentSectionId = section.getAttribute("id");
            }
        });

        navItems.forEach((item) => {
            item.classList.remove("active");
            const href = item.getAttribute("href");

            if (href === `#${currentSectionId}`) {
                item.classList.add("active");
            }
        });

        // Keep Home active near top
        if (window.scrollY < 120) {
            navItems.forEach((item) => item.classList.remove("active"));
            const homeLink = document.querySelector('.nav-link[href="#home"]');
            if (homeLink) {
                homeLink.classList.add("active");
            }
        }
    };

    setActiveNav();
    window.addEventListener("scroll", setActiveNav);

    // Reveal on scroll
    if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
            (entries, obs) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("visible");
                        obs.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.12,
                rootMargin: "0px 0px -40px 0px"
            }
        );

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add("visible"));
    }

    // Close menu if user presses Escape
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navLinks.classList.contains("active")) {
            closeMobileMenu();
        }
    });

    // Live weather from Open-Meteo
    const weatherCard = document.getElementById("weather-card");
    const weatherStatus = document.getElementById("weather-status");
    const weatherContent = document.getElementById("weather-content");
    const weatherEmoji = document.getElementById("weather-emoji");
    const weatherLocation = document.getElementById("weather-location");
    const weatherCondition = document.getElementById("weather-condition");
    const weatherTemp = document.getElementById("weather-temp");
    const weatherHumidity = document.getElementById("weather-humidity");
    const weatherWind = document.getElementById("weather-wind");
    const weatherUpdated = document.getElementById("weather-updated");

    const WEATHER_API =
        "https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto";

    const weatherCodeMap = {
        0: { label: "Clear sky", emoji: "☀️" },
        1: { label: "Mainly clear", emoji: "🌤️" },
        2: { label: "Partly cloudy", emoji: "⛅" },
        3: { label: "Overcast", emoji: "☁️" },
        45: { label: "Fog", emoji: "🌫️" },
        48: { label: "Rime fog", emoji: "🌫️" },
        51: { label: "Light drizzle", emoji: "🌦️" },
        53: { label: "Drizzle", emoji: "🌦️" },
        55: { label: "Dense drizzle", emoji: "🌧️" },
        61: { label: "Slight rain", emoji: "🌧️" },
        63: { label: "Rain", emoji: "🌧️" },
        65: { label: "Heavy rain", emoji: "🌧️" },
        71: { label: "Slight snow", emoji: "🌨️" },
        73: { label: "Snow", emoji: "❄️" },
        75: { label: "Heavy snow", emoji: "❄️" },
        80: { label: "Rain showers", emoji: "🌦️" },
        81: { label: "Rain showers", emoji: "🌧️" },
        82: { label: "Violent rain showers", emoji: "⛈️" },
        95: { label: "Thunderstorm", emoji: "⛈️" },
        96: { label: "Thunderstorm with hail", emoji: "⛈️" },
        99: { label: "Thunderstorm with hail", emoji: "⛈️" }
    };

    const formatUpdatedTime = (isoTime) => {
        const date = new Date(isoTime);

        if (Number.isNaN(date.getTime())) {
            return isoTime;
        }

        return date.toLocaleString(undefined, {
            hour: "numeric",
            minute: "2-digit"
        });
    };

    const showWeatherError = (message) => {
        if (!weatherStatus || !weatherContent) return;

        weatherContent.classList.add("is-hidden");
        weatherStatus.classList.remove("is-hidden");
        weatherStatus.classList.add("is-error");
        weatherStatus.innerHTML = `
            <p>${message}</p>
            <button class="btn btn-secondary btn-small retry-weather" type="button">Try again</button>
        `;

        const retryButton = weatherStatus.querySelector(".retry-weather");
        if (retryButton) {
            retryButton.addEventListener("click", loadWeather);
        }
    };

    const renderWeather = (data) => {
        const current = data.current || {};
        const units = data.current_units || {};
        const code = current.weather_code;
        const mapped = weatherCodeMap[code] || { label: "Weather update", emoji: "🌡️" };
        const timezoneName = (data.timezone || "").split("/").pop()?.replaceAll("_", " ") || "Berlin";

        weatherEmoji.textContent = mapped.emoji;
        weatherLocation.textContent = timezoneName;
        weatherCondition.textContent = mapped.label;
        weatherTemp.textContent = `${Math.round(current.temperature_2m)}${units.temperature_2m || "°C"}`;
        weatherHumidity.textContent = `${current.relative_humidity_2m}${units.relative_humidity_2m || "%"}`;
        weatherWind.textContent = `${current.wind_speed_10m} ${units.wind_speed_10m || "km/h"}`;
        weatherUpdated.textContent = formatUpdatedTime(current.time);

        weatherStatus.classList.add("is-hidden");
        weatherStatus.classList.remove("is-error");
        weatherContent.classList.remove("is-hidden");
    };

    async function loadWeather() {
        if (!weatherCard || !weatherStatus || !weatherContent) return;

        weatherContent.classList.add("is-hidden");
        weatherStatus.classList.remove("is-hidden", "is-error");
        weatherStatus.innerHTML = `
            <span class="weather-loader" aria-hidden="true"></span>
            <p>Fetching live weather…</p>
        `;

        try {
            const response = await fetch(WEATHER_API);

            if (!response.ok) {
                throw new Error("Weather request failed");
            }

            const data = await response.json();
            renderWeather(data);
        } catch (error) {
            showWeatherError("Live weather could not be loaded right now.");
        }
    }

    loadWeather();
});