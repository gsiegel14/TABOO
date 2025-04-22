
/*
 * Taboo Game Card Data
 */

const tabooCards = [
  {
    "id": 1,
    "prompt": "In the upper right abdomen, place your probe coronally between ribs to visualize the potential space between the liver and the right kidney.",
    "targetWord": "Morison's Pouch View",
    "target_img": "images/cards/local/1_target_MorisonNoText.png",
    "probe_img": "images/cards/local/1_probe_fast_ruq_probe.jpg",
    "tabooWords": [
      "FAST",
      "Morison's",
      "RUQ", 
      "Liver",
      "Kidney"
    ]
  }
];

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tabooCards };
}
