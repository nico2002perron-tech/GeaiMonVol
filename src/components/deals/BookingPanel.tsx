'use client';
import { useState, useEffect } from 'react';
import { HOTELS } from '../data/hotels'; // Assuming HOTELS is exported from here
// import { Flight } from '../data/flights'; // Need Flight interface

// Activity preference categories
const PREF_CATEGORIES = [
    { id: "culture", icon: "🏛", label: "Culture et histoire", desc: "Musees, monuments, sites historiques" },
    { id: "food", icon: "🍽", label: "Gastronomie", desc: "Restaurants locaux, street food, marches" },
    { id: "adventure", icon: "🤿", label: "Aventure et sport", desc: "Randonnee, plongee, velo, escalade" },
    { id: "nature", icon: "🌿", label: "Nature et paysages", desc: "Parcs, plages, points de vue" },
    { id: "nightlife", icon: "🌙", label: "Vie nocturne", desc: "Bars, rooftops, spectacles" },
    { id: "shopping", icon: "🛍", label: "Shopping", desc: "Marches locaux, boutiques, souvenirs" },
    { id: "relax", icon: "🧘", label: "Detente et bien-etre", desc: "Spas, hammams, journees tranquilles" },
    { id: "photo", icon: "📸", label: "Spots photo", desc: "Les meilleurs endroits pour des photos memorables" },
];

interface BookingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFlight?: any; // Should be Flight interface
}

export default function BookingPanel({ isOpen, onClose, selectedFlight }: BookingPanelProps) {
    const [step, setStep] = useState(0);
    const [selectedHotel, setSelectedHotel] = useState<any>(null);
    const [guideWanted, setGuideWanted] = useState(false);
    const [prefs, setPrefs] = useState<string[]>([]);
    const [tripDays, setTripDays] = useState(5);
    const [restDays, setRestDays] = useState(1);
    const [email, setEmail] = useState('');

    // Reset state when panel opens with a new flight
    useEffect(() => {
        if (isOpen && selectedFlight) {
            setStep(0);
            setSelectedHotel(null);
            setGuideWanted(false);
            setPrefs([]);
            setTripDays(5);
            setRestDays(1);
            setEmail('');
        }
    }, [isOpen, selectedFlight]);

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
        else onClose();
    };

    const handleNext = () => {
        if (step === 0) setStep(1);
        else if (step === 1) setStep(2);
        else if (step === 2) setStep(3);
        else {
            // Final confirm
            if (guideWanted && prefs.length > 0) {
                sendGuideRequest();
            } else {
                alert('Reservation confirmee ! Bon voyage a ' + selectedFlight.city + ' !');
                onClose();
            }
        }
    };

    const sendGuideRequest = () => {
        if (!selectedFlight) return;
        const f = selectedFlight;
        const h = selectedHotel;
        const subject = encodeURIComponent('GeaiMonVol - Guide IA - ' + f.city);
        const prefsText = prefs.map(p => {
            const cat = PREF_CATEGORIES.find(c => c.id === p);
            return cat ? cat.icon + ' ' + cat.label : p;
        }).join(', ');

        const body = encodeURIComponent(
            'Nouvelle commande de Guide IA GeaiMonVol\n\n' +
            'Destination : ' + f.city + ', ' + f.country + '\n' +
            'Vol : ' + f.route + ' | ' + f.dates + ' | ' + f.price + ' $\n' +
            (h ? 'Hotel : ' + h.name + ' (' + h.stars + ' etoiles, ' + h.price + ' $/nuit)\n' : 'Hotel : Non selectionne\n') +
            'Duree : ' + tripDays + ' jours\n' +
            'Jours de repos : ' + restDays + '\n' +
            'Preferences : ' + prefsText + '\n' +
            'Email client : ' + email + '\n\n' +
            'Montant guide : 10 $\n' +
            '---\n' +
            'A generer par l\'IA :\n' +
            '- Plan jour par jour optimise\n' +
            '- Meilleures activites touristiques incontournables\n' +
            '- Reservations necessaires (sites, liens, quand reserver)\n' +
            '- Conseils pratiques et astuces locales'
        );
        window.open('mailto:votre@email.com?subject=' + subject + '&body=' + body, '_blank');
        alert('Merci ! Votre guide personnalise pour ' + f.city + ' sera pret sous 24h. Verifiez vos courriels !');
        onClose();
    };


    if (!selectedFlight) return null; // Or some empty state

    const cityHotels = HOTELS.filter(h => h.city === selectedFlight.city);

    // Dynamic Title/Subtitle/CTA based on step
    let title = 'Votre vol';
    let sub = selectedFlight.route + ' · ' + selectedFlight.dates;
    let ctaText = 'Choisir un hotel';
    let ctaDisabled = false;

    if (step === 1) {
        title = 'Hotels a ' + selectedFlight.city;
        sub = 'Selectionnez votre hotel';
        ctaText = 'Etape suivante';
        ctaDisabled = !selectedHotel && cityHotels.length > 0; // Allow skip if no hotels? Original code allows skip via button
    } else if (step === 2) {
        title = 'Guide IA personnalise';
        sub = 'Optimisez votre voyage a ' + selectedFlight.city;
        ctaText = guideWanted ? 'Personnaliser mon guide' : 'Voir le recapitulatif';
    } else if (step === 3) {
        if (guideWanted) {
            title = 'Vos preferences';
            sub = 'Dites-nous ce que vous aimez faire a ' + selectedFlight.city;
            ctaText = 'Confirmer et recevoir mon guide';
            ctaDisabled = prefs.length === 0 || !email;
        } else {
            // Recap Final (No Guide)
            title = 'Recapitulatif';
            sub = selectedFlight.city + ' — Votre voyage';
            ctaText = 'Confirmer';
        }
    }

    // Step Rendering logic integrated into JSX for React

    return (
        <div className={`book-panel ${isOpen ? 'open' : ''}`} id="bookPanel">
            <div className="book-header">
                            )}
                        </div>
                    ))}
                </div>

                <div className="book-step-labels">
                    <span className={`book-step-lbl ${step === 0 ? 'active' : ''}`}>Vol</span>
                    <span className={`book-step-lbl ${step === 1 ? 'active' : ''}`}>Hôtel</span>
                    <span className={`book-step-lbl ${step === 2 ? 'active' : ''}`}>Guide IA</span>
                    <span className={`book-step-lbl ${step === 3 ? 'active' : ''}`}>Récap</span>
                </div>

                <div className="book-title" id="bookTitle">
                    {step === 0 && 'Votre vol'}
                    {step === 1 && 'Choisir un hôtel'}
                    {step === 2 && 'Votre guide IA'}
                    {step === 3 && 'Récapitulatif'}
                </div>
                <div className="book-subtitle" id="bookSubtitle">
                    {step === 0 && 'Vol sélectionné pour votre voyage'}
                    {step === 1 && 'Complétez votre voyage'}
                    {step === 2 && 'Personnalisation'}
                    {step === 3 && 'Confirmez votre réservation'}
                </div>
            </div >

            <div className="book-content" id="bookContent">
                {/* Content will be injected dynamically or managed here */}
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', marginTop: '40px' }}>
                    Contenu de l'étape {step + 1} en attente d'intégration.
                </p>
            </div>

            <div className="book-footer">
                <button
                    className="book-cta"
                    id="bookCta"
                    onClick={() => setStep(s => s < 3 ? s + 1 : 0)}
                >
                    {step === 3 ? 'Confirmer' : 'Continuer'}
                </button>
            </div>
        </div >
    );
}
