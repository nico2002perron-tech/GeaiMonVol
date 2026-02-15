"use client";
import { useState } from "react";

export default function SearchModule() {
    const [activeTab, setActiveTab] = useState("flights");

    return (
        <div className="search-module">
            <div className="tabs-bar">
                <button
                    className={`tab-btn ${activeTab === "flights" ? "active" : ""}`}
                    onClick={() => setActiveTab("flights")}
                >
                    <span className="icon">
                        <svg>
                            <use href="#i-plane" />
                        </svg>
                    </span>{" "}
                    Vols
                </button>
                <button
                    className={`tab-btn ${activeTab === "hotels" ? "active" : ""}`}
                    onClick={() => setActiveTab("hotels")}
                >
                    <span className="icon">
                        <svg>
                            <use href="#i-hotel" />
                        </svg>
                    </span>{" "}
                    Hôtels
                </button>
                <button
                    className={`tab-btn ${activeTab === "combo" ? "active" : ""}`}
                    onClick={() => setActiveTab("combo")}
                >
                    <span className="icon">
                        <svg>
                            <use href="#i-sparkles" />
                        </svg>
                    </span>{" "}
                    Tout-inclus
                </button>
            </div>
            <div className="search-panel">
                <div
                    className={`tab-content ${activeTab === "flights" ? "active" : ""}`}
                    id="tc-flights"
                >
                    <div className="fg fg-4">
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-map" />
                                    </svg>
                                </span>{" "}
                                Départ
                            </div>
                            <input placeholder="Montréal (YUL)" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-globe" />
                                    </svg>
                                </span>{" "}
                                Destination
                            </div>
                            <input placeholder="Où aller?" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-calendar" />
                                    </svg>
                                </span>{" "}
                                Aller
                            </div>
                            <input type="date" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-calendar" />
                                    </svg>
                                </span>{" "}
                                Retour
                            </div>
                            <input type="date" />
                        </div>
                    </div>
                    <button className="btn-search">
                        <span className="icon">
                            <svg>
                                <use href="#i-search" />
                            </svg>
                        </span>{" "}
                        Chercher
                    </button>
                </div>
                <div
                    className={`tab-content ${activeTab === "hotels" ? "active" : ""}`}
                    id="tc-hotels"
                >
                    <div className="fg fg-4">
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-map" />
                                    </svg>
                                </span>{" "}
                                Ville
                            </div>
                            <input placeholder="Paris, Cancún..." />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-calendar" />
                                    </svg>
                                </span>{" "}
                                Arrivée
                            </div>
                            <input type="date" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-calendar" />
                                    </svg>
                                </span>{" "}
                                Départ
                            </div>
                            <input type="date" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-users" />
                                    </svg>
                                </span>{" "}
                                Voyageurs
                            </div>
                            <select>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4+</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn-search">
                        <span className="icon">
                            <svg>
                                <use href="#i-search" />
                            </svg>
                        </span>{" "}
                        Chercher
                    </button>
                </div>
                <div
                    className={`tab-content ${activeTab === "combo" ? "active" : ""}`}
                    id="tc-combo"
                >
                    <div className="fg fg-4">
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-map" />
                                    </svg>
                                </span>{" "}
                                Départ
                            </div>
                            <input placeholder="Montréal (YUL)" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-globe" />
                                    </svg>
                                </span>{" "}
                                Destination
                            </div>
                            <input placeholder="Destination..." />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-calendar" />
                                    </svg>
                                </span>{" "}
                                Dates
                            </div>
                            <input type="date" />
                        </div>
                        <div className="field">
                            <div className="field-label">
                                <span className="icon icon-sm">
                                    <svg>
                                        <use href="#i-clock" />
                                    </svg>
                                </span>{" "}
                                Durée
                            </div>
                            <select>
                                <option>3-5 jours</option>
                                <option>1 semaine</option>
                                <option>2 semaines</option>
                                <option>3+ semaines</option>
                            </select>
                        </div>
                    </div>
                    <button className="btn-search">
                        <span className="icon">
                            <svg>
                                <use href="#i-sparkles" />
                            </svg>
                        </span>{" "}
                        Trouver mon forfait
                    </button>
                </div>
                <div className="guarantee-bar">
                    <div className="guarantee-item">
                        <span className="icon icon-sm">
                            <svg>
                                <use href="#i-shield" />
                            </svg>
                        </span>{" "}
                        Meilleur prix garanti
                    </div>
                    <div className="guarantee-item">
                        <span className="icon icon-sm">
                            <svg>
                                <use href="#i-scan" />
                            </svg>
                        </span>{" "}
                        120+ sources comparées
                    </div>
                    <div className="guarantee-item">
                        <span className="icon icon-sm">
                            <svg>
                                <use href="#i-refresh" />
                            </svg>
                        </span>{" "}
                        Vérifié aux 15 min
                    </div>
                </div>
            </div>
        </div>
    );
}
