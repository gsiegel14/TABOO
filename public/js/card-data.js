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
  },
  {
    "id": 16,
    "prompt": "Place the probe transversely on the side of the neck, above the clavicle, slide posteriorly to find the nerve bundle appearing as circles between two muscles.",
    "targetWord": "Interscalene Block View",
    "target_img": "images/cards/local/16_target.png",
    "probe_img": null,
    "local_target_img": "images/cards/local/16_target.png",
    "local_probe_img": null,
    "tabooWords": [
      "Interscalene", 
      "Plexus", 
      "Roots", 
      "Neck", 
      "Block", 
      "Brachial", 
      "Scalene", 
      "Stoplight"
    ]
  }
];

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { tabooCards };
}
