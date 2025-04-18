/**
 * Taboo Game Card Data
 * Contains all the cards for the Taboo game
 */

const tabooCards = [
    {
        id: 1,
        targetWord: "Ultrasound",
        tabooWords: ["Sound", "Waves", "Imaging", "Scan", "Probe"],
        category: "Medical Imaging"
    },
    {
        id: 2,
        targetWord: "VEXUS",
        tabooWords: ["Venous", "Excess", "Ultrasound", "Score", "Congestion"],
        category: "Medical Term"
    },
    {
        id: 3,
        targetWord: "Doppler",
        tabooWords: ["Effect", "Ultrasound", "Blood", "Flow", "Velocity"],
        category: "Technique"
    },
    {
        id: 4,
        targetWord: "Probe",
        tabooWords: ["Transducer", "Ultrasound", "Device", "Scanner", "Wand"],
        category: "Equipment"
    },
    {
        id: 5,
        targetWord: "Kidney",
        tabooWords: ["Organ", "Renal", "Filter", "Blood", "Urine"],
        category: "Anatomy"
    },
    {
        id: 6,
        targetWord: "Vein",
        tabooWords: ["Blood", "Vessel", "Return", "Blue", "Flow"],
        category: "Anatomy"
    },
    {
        id: 7,
        targetWord: "Artery",
        tabooWords: ["Blood", "Vessel", "Pulse", "Heart", "Red"],
        category: "Anatomy"
    },
    {
        id: 8,
        targetWord: "Congestion",
        tabooWords: ["Fluid", "Buildup", "Swelling", "Traffic", "Blocked"],
        category: "Medical Term"
    },
    {
        id: 9,
        targetWord: "IVC",
        tabooWords: ["Inferior", "Vena", "Cava", "Vein", "Heart"],
        category: "Anatomy"
    },
    {
        id: 10,
        targetWord: "Hepatic Vein",
        tabooWords: ["Liver", "Blood", "Vessel", "IVC", "Flow"],
        category: "Anatomy"
    },
    {
        id: 11,
        targetWord: "Portal Vein",
        tabooWords: ["Liver", "Blood", "Vessel", "Hepatic", "Flow"],
        category: "Anatomy"
    },
    {
        id: 12,
        targetWord: "Renal Vein",
        tabooWords: ["Kidney", "Blood", "Vessel", "IVC", "Flow"],
        category: "Anatomy"
    },
    {
        id: 13,
        targetWord: "Diagnosis",
        tabooWords: ["Identify", "Disease", "Condition", "Patient", "Doctor"],
        category: "Medical Term"
    },
    {
        id: 14,
        targetWord: "Transducer",
        tabooWords: ["Probe", "Ultrasound", "Device", "Scan", "Convert"],
        category: "Equipment"
    },
    {
        id: 15,
        targetWord: "Heart Failure",
        tabooWords: ["Pump", "Cardiac", "Weak", "Organ", "Condition"],
        category: "Medical Condition"
    },
    {
        id: 16,
        targetWord: "Aorta",
        tabooWords: ["Artery", "Largest", "Heart", "Blood", "Vessel"],
        category: "Anatomy"
    },
    {
        id: 17,
        targetWord: "Stenosis",
        tabooWords: ["Narrowing", "Restriction", "Blood", "Flow", "Vessel"],
        category: "Medical Condition"
    },
    {
        id: 18,
        targetWord: "Echogenic",
        tabooWords: ["Reflect", "Sound", "Ultrasound", "Bright", "Image"],
        category: "Imaging Term"
    },
    {
        id: 19,
        targetWord: "Anechoic",
        tabooWords: ["Dark", "Fluid", "Ultrasound", "Image", "Cyst"],
        category: "Imaging Term"
    },
    {
        id: 20,
        targetWord: "Physician",
        tabooWords: ["Doctor", "Medical", "Treat", "Patient", "Healthcare"],
        category: "Profession"
    }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tabooCards };
} 