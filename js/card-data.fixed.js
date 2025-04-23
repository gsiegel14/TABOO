/*
 * Taboo Game Card Data (Revised for Scanning Normal Anatomy on Models)
 * Prompts focus on finding standard views or normal structures,
 * suitable for blindfolded scanning practice on ultrasound models/phantoms.
 */

const tabooCards = [
  {
    id: 1,
    prompt: "In the upper right abdomen, place your probe coronally between ribs to visualize the potential space between the liver and the right kidney.",
    targetWord: "Morison's Pouch View",
    target_img: "images/cards/local/1_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/1_target.png",
    local_probe_img: null,
    tabooWords: ["FAST", "Morison's", "RUQ", "Liver", "Kidney", "Hepatorenal", "Fluid"],
    remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/f/fa/MorisonNoText.png"
  },
  {
    id: 2,
    prompt: "In the upper left abdomen, place your probe coronally between ribs to visualize the potential space between the spleen and the left kidney.",
    targetWord: "Splenorenal Recess View",
    target_img: "images/cards/local/2_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/2_target.jpg",
    local_probe_img: null,
    tabooWords: ["LUQ", "Spleen", "Kidney", "FAST", "Splenorenal", "Fluid"],
    remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/4/45/Ultrasound_image_of_spleen_110302084356_0847450.jpg"
  },
  {
    id: 3,
    prompt: "Place your probe just above the pubic bone in the midline, aiming caudally in a long-axis (sagittal) orientation to view the bladder.",
    targetWord: "Bladder Long Axis",
    target_img: "images/cards/local/3_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/3_target.png",
    local_probe_img: null,
    tabooWords: ["Pelvis", "Suprapubic", "Sagittal", "Urine", "Volume", "FAST"],
    remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Ultrasound_Scan_ND_0126112316_1129461.png"
  },
  {
    id: 4,
    prompt: "Place your probe just below the xiphoid process, angling sharply towards the patient's left shoulder to obtain a four-chamber view of the heart through the liver.",
    targetWord: "Subxiphoid Cardiac View",
    target_img: "images/cards/local/4_target.gif",
    probe_img: null,
    local_target_img: "images/cards/local/4_target.gif",
    local_probe_img: null,
    tabooWords: ["Subcostal", "Heart", "Cardiac", "Chamber", "Liver", "FAST", "Effusion"],
    remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/9/91/Subcostal_view_of_heart.gif"
  },
  {
    id: 5,
    prompt: "Place the probe just left of the sternum in the 3rd or 4th intercostal space, orienting the marker towards the right shoulder, to view the heart's long axis.",
    targetWord: "Parasternal Long Axis (PLAX)",
    target_img: "images/cards/local/5_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/5_target.jpg",
    local_probe_img: null,
    tabooWords: ["Parasternal", "Long", "Axis", "Cardiac", "Heart", "PLAX", "Sternum"],
    remote_target_img: "https://prod-images-static.radiopaedia.org/images/42060906/d8220e9db92dcbe66e9226b936ad22.jpg"
  },
  {
    id: 6,
    prompt: "What is the best view to obtain LOVT VTI.",
    targetWord: "Apical Four Chamber (A4C)",
    target_img: "images/cards/local/6_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/6_target.jpg",
    local_probe_img: null,
    tabooWords: ["Apical", "Four", "Chamber", "Cardiac", "Heart", "A4C", "PMI"],
    remote_target_img: "https://www.echocardia.com/en/wiki.html/Five%20chamber%20view"
  },
  {
    id: 7,
    prompt: "Place the probe just below the xiphoid process, slightly to the patient's right, in a long-axis (sagittal) orientation to visualize the large vein entering the right atrium.",
    targetWord: "IVC Long Axis",
    target_img: "images/cards/local/7_target.gif",
    probe_img: null,
    local_target_img: "images/cards/local/7_target.gif",
    local_probe_img: null,
    tabooWords: ["IVC", "Cava", "Volume", "Subcostal", "Sagittal", "Vein", "Atrium"],
    remote_target_img: "https://upload.wikimedia.org/wikipedia/commons/5/58/Inferior_vena_cava_ultrasound.gif"
  },
  {
    id: 8,
    prompt: "Place the probe on the anterior chest wall between ribs. Use M-mode through the pleural line to identify the normal 'waves on a beach' pattern.",
    targetWord: "M-mode Seashore Sign",
    target_img: "images/cards/local/8_target.gif",
    probe_img: null,
    local_target_img: "images/cards/local/8_target.gif",
    local_probe_img: null,
    tabooWords: ["Lung", "Sliding", "Pleura", "M-mode", "Seashore", "Beach", "Pneumothorax"],
    remote_target_img: "https://pocus101.b-cdn.net/wp-content/uploads/2020/10/A-lines-with-Lung-Sliding-Labeled.gif"
  },
  {
    id: 9,
    prompt: "Place the probe longitudinally on the anterior chest wall between ribs to identify the bright pleural line and the repeating horizontal lines deep to it.",
    targetWord: "A-lines (Normal Lung)",
    target_img: "images/cards/local/9_target.gif",
    probe_img: null,
    local_target_img: "images/cards/local/9_target.gif",
    local_probe_img: null,
    tabooWords: ["Lung", "Pleura", "Horizontal", "Artifact", "Ribs", "Chest"],
    remote_target_img: "https://i0.wp.com/nephropocus.com/wp-content/uploads/2020/09/Twit-1.gif?fit=600%2C376&ssl=1"
  },
  {
    id: 10,
    prompt: "Place the probe coronally at the posterior axillary line above the diaphragm to view the lung base, diaphragm, and the mirror image artifact above it.",
    targetWord: "Lung Diaphragm View",
    target_img: "images/cards/local/10_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/10_target.png",
    local_probe_img: null,
    tabooWords: ["Lung", "Base", "Diaphragm", "Spine Sign", "PLAPS", "Mirror", "Effusion"],
    remote_target_img: "https://pocus101.b-cdn.net/wp-content/uploads/2020/10/L3-Left-PLAPS-labeled-Spleen-diaphragm-lung-spine.png"
  },
  {
    id: 11,
    prompt: "Place the probe in the supraclavicular fossa, just above the clavicle, with the indicator pointing cephalad, to visualize the cluster of hypoechoic round nodules just posterior to the subclavian artery representing the brachial plexus trunks.",
    targetWord: "Supraclavicular Brachial Plexus",
    target_img: "images/cards/local/11_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/11_target.png",
    local_probe_img: null,
    tabooWords: ["Clavicle", "Subclavian", "Artery", "Plexus", "Fossa", "Trunks", "BP", "Block"],
    remote_target_img: "https://www.baby-blocks.com/block-detail/supraclavicular-brachial-plexus-nerve-block"
  },
  {
    id: 12,
    prompt: "Place the probe transversely on the upper abdomen, identify the vertebral body shadow, and locate the large pulsating circular vessel just anterior and slightly left.",
    targetWord: "Aorta Transverse (Normal)",
    target_img: "images/cards/local/12_target.webp",
    probe_img: null,
    local_target_img: "images/cards/local/12_target.webp",
    local_probe_img: null,
    tabooWords: ["Aorta", "Transverse", "Abdomen", "Vertebra", "Pulsatile", "Artery", "AAA"],
    remote_target_img: "https://images.squarespace-cdn.com/content/v1/605f41f52dd559450832dee6/02cc64c9-f51e-4242-b723-808c858c2683/2.png?format=750w"
  },
  {
    id: 13,
    prompt: "Show me the Mercedes-Benz sign.",
    targetWord: "Parasternal Short Axis (Aortic)",
    target_img: "images/cards/local/13_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/13_target.jpg",
    local_probe_img: null,
    tabooWords: ["PSAX", "Short", "Axis", "Aortic", "Valve", "Mercedes", "Heart", "Parasternal"],
    remote_target_img: "https://i.pinimg.com/474x/72/97/ca/7297ca07a86df3589b10c6059b48e106.jpg"
  },
  {
    id: 14,
    prompt: "Identify the Popliteal vein and artery behind the knee",
    targetWord: "Popliteal Vein Compression",
    target_img: "images/cards/local/14_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/14_target.png",
    local_probe_img: null,
    tabooWords: ["Popliteal", "Vein", "Artery", "Knee", "Compress", "DVT", "Thrombus"],
    remote_target_img: "https://www.researchgate.net/publication/334892929/figure/fig4/AS:787447461990400@1564753513020/Ultrasound-image-for-infiltration-between-the-popliteal-artery-and-capsule-of-the.png"
  },
  {
    id: 15,
    prompt: "Identify the 'fish mouth' view",
    targetWord: "Parasternal Short Axis (Mitral)",
    target_img: "images/cards/local/15_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/15_target.jpg",
    local_probe_img: null,
    tabooWords: ["PSAX", "Short", "Axis", "Mitral", "Valve", "Fish Mouth", "Heart", "Parasternal"],
    remote_target_img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT5RmZCMJX0fA6rgGw3s1PANmx4e-cdEcdGkw&s"
  },
  {
    id: 16,
    prompt: "Place the probe transversely on the side of the neck, above the clavicle, slide posteriorly to find the nerve bundle appearing as circles between two muscles.",
    targetWord: "Interscalene Block View",
    target_img: "images/cards/local/16_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/16_target.png",
    local_probe_img: null,
    tabooWords: ["Interscalene", "Plexus", "Roots", "Neck", "Block", "Brachial", "Scalene", "Stoplight"],
    remote_target_img: "https://www.researchgate.net/publication/308174144/figure/fig3/AS:408177389654018@1474328481595/Sonographic-view-of-interscalene-brachial-plexus-block-with-conventional-approach.png"
  },
  {
    id: 17,
    prompt: "Show me how you eval for a posterior sail sign",
    targetWord: "Elbow Effusion",
    target_img: "images/cards/local/17_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/17_target.png",
    local_probe_img: null,
    tabooWords: ["elbow", "joint", "arm", "broken", "supracondylar"],
    remote_target_img: "https://www.pocustoronto.com/wordpress/wp-content/uploads/2017/02/Elbow-US-Effusion-with-markup.jpg"
  },
  {
    id: 18,
    prompt: "Show me where you measure the GB wall.",
    targetWord: "Gallbladder Short Axis",
    target_img: "images/cards/local/18_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/18_target.jpg",
    local_probe_img: null,
    tabooWords: ["Gallbladder", "GB", "Short", "Transverse", "RUQ", "Liver", "Wall"],
    remote_target_img: "https://radiologyassistant.nl/assets/gallbladder-wall-thickening/a509797711a4d1_Fig-1A.jpg"
  },
  {
    id: 19,
    prompt: "In the right upper quadrant, identify the mickey mouse",
    targetWord: "Common Bile Duct (Normal)",
    target_img: "images/cards/local/19_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/19_target.jpg",
    local_probe_img: null,
    tabooWords: ["CBD", "Bile Duct", "Portal", "Triad", "Hepatic", "RUQ", "Liver", "Mickey Mouse"],
    remote_target_img: "https://med.emory.edu/departments/emergency-medicine/_images/ultrasound/image-week/imageoftheweek-071711.jpg"
  },
  {
    id: 20,
    prompt: "Place the probe coronally on the patient's flank (right or left) to view the kidney in its longest dimension",
    targetWord: "Kidney Long Axis",
    target_img: "images/cards/local/20_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/20_target.jpg",
    local_probe_img: null,
    tabooWords: ["Kidney", "Renal", "Long", "Coronal", "Flank", "Cortex", "Hydro"],
    remote_target_img: "https://www.researchgate.net/publication/367813656/figure/fig2/AS:11431281116733636@1675302116999/Doppler-imaging-of-right-kidney-long-axis-demonstrating-absence-of-flow-in-the-dilated.jpg"
  },
  {
    id: 21,
    prompt: "Get me a bladder view so I can measure a PVR (2 planes).",
    targetWord: "Bladder Volume Measurement Views",
    target_img: "images/cards/local/21_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/21_target.png",
    local_probe_img: null,
    tabooWords: ["Bladder", "Urine", "Volume", "PVR", "Pelvis", "Suprapubic", "Transverse", "Sagittal"],
    remote_target_img: "https://www.augusta.edu/mcg/ultrasound-education/paphysicalassessment.php"
  },
  {
    id: 22,
    prompt: "For severe lumbar back pain at the L4 level, place the ultrasound probe in a parasagittal plane approximately 3 cm lateral to midline at the level of the L4 transverse process, with the marker oriented cephalad, to visualize the erector spinae muscle overlying the transverse process for an ESP block.",
    targetWord: "Erector Spinae Plane (ESP)",
    target_img: "images/cards/local/22_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/22_target.jpg",
    local_probe_img: null,
    tabooWords: ["ESP", "Plane", "Erector", "Spinae", "L4", "Lumbar", "Back"],
    remote_target_img: "https://www.emra.org/contentassets/c2d301b113c34e38b75be2824f21c586/46-6-ultrasound---image-3a---erector-spinae-plane.jpg"
  },
  {
    id: 23,
    prompt: "From the apical four-chamber view, rotate the probe counter-clockwise slightly to eliminate the right-sided chambers, focusing on the left atrium and left ventricle.",
    targetWord: "Apical Two Chamber (A2C)",
    target_img: "images/cards/local/23_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/23_target.jpg",
    local_probe_img: null,
    tabooWords: ["Apical", "Two", "Chamber", "A2C", "Heart", "Cardiac", "Left", "LV"],
    remote_target_img: "https://www.icuecho.com/images/apical2_2.jpg"
  },
  {
    id: 24,
    prompt: "Place the probe transversely over the anterior neck below the jaw to visualize the butterfly-shaped gland anterior to the trachea.",
    targetWord: "Thyroid Gland Transverse",
    target_img: "images/cards/local/24_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/24_target.png",
    local_probe_img: null,
    tabooWords: ["Thyroid", "Neck", "Transverse", "Isthmus", "Gland", "Trachea", "Butterfly"],
    remote_target_img: "https://rfaforlife.com/wp-content/uploads/2022/04/thyroid2.png"
  },
  {
    id: 26,
    prompt: "Identify and center the carotid in the center of your screen in long axis.",
    targetWord: "Carotid/IJ Long Axis",
    target_img: "images/cards/local/26_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/26_target.jpg",
    local_probe_img: null,
    tabooWords: ["Carotid", "Jugular", "IJ", "Vein", "Artery", "Neck", "Long", "Vessel"],
    remote_target_img: "https://www.researchgate.net/profile/Mathieu-Veyrat-2/publication/337882317/figure/fig1/AS:874483715940354@1585504573642/A-B-mode-ultrasound-scan-in-the-long-axis-of-the-left-carotid-bulb-hyperechoic.ppm"
  },
  {
    id: 27,
    prompt: "Place the probe transversely on the posterior shoulder below the scapular spine to visualize the round humeral head articulating with the glenoid.",
    targetWord: "Posterior Glenohumeral Joint",
    target_img: "images/cards/local/27.webp",
    probe_img: null,
    local_target_img: "images/cards/local/27.webp",
    local_probe_img: null,
    tabooWords: ["Shoulder", "Joint", "Posterior", "Glenohumeral", "Humeral Head", "Glenoid", "MSK"],
    remote_target_img: "https://www.researchgate.net/publication/372033753/figure/fig2/AS:11431281171982927@1688411774672/Posterior-shoulder-ultrasound-demonstrating-anteriorly-dislocated-humeral-head-courtesy.png"
  },
  {
    id: 28,
    prompt: "With the patient's elbow flexed at 90° and the forearm pronated, place the ultrasound probe longitudinally just proximal to the olecranon, with the marker directed proximally, to visualize the distal triceps tendon in long‑axis view.",
    targetWord: "Long‑Axis Triceps Tendon",
    target_img: "images/cards/local/28_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/28_target.png",
    local_probe_img: null,
    tabooWords: ["Triceps", "Tendon", "Long", "Axis", "Distal", "Olecranon", "Posterior"],
    remote_target_img: "https://www.ncbi.nlm.nih.gov/books/NBK570156/figure/ch16.Fig3/?report=objectonly"
  },
  {
    id: 29,
    prompt: "Imagine you twisted your lower limb stepping off a curb, causing pain and swelling where your leg connects to your foot. To assess this region, visualize the specific articulation formed superiorly by the distal ends of the two lower leg bones (tibia and fibula) and inferiorly by a key tarsal bone (the talus). This hinge joint is primarily responsible for allowing your foot to point upwards (dorsiflexion) and downwards (plantarflexion). Focus on identifying this crucial joint complex.",
    targetWord: "Ankle Joint",
    target_img: "images/cards/local/29_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/29_target.jpg",
    local_probe_img: null,
    tabooWords: ["Ankle", "Tibia", "Fibula", "Talus", "Malleolus", "Tarsus", "Foot", "Leg"],
    remote_target_img: "https://www.nysora.com/wp-content/uploads/2024/06/June-6-NEWS-Ankle-joint-effusion-1030x579.jpg"
  },
  {
    id: 30,
    prompt: "Show me the organ that in long axis that gets big and juicy with sickle cell or EBV.",
    targetWord: "Spleen Long Axis",
    target_img: "images/cards/local/30_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/30_target.jpg",
    local_probe_img: null,
    tabooWords: ["Spleen", "LUQ", "Long", "Coronal", "Kidney", "Organ"],
    remote_target_img: "https://www.pocus.org/wp-content/uploads/2023/05/Picture4-300x242.jpg"
  },
  {
    id: 31,
    prompt: "Place the probe longitudinally on the upper anterior chest wall between two ribs to clearly identify the bright, shimmering line or ants on alog representing the lung surface.",
    targetWord: "Pleural Line Identification",
    target_img: "images/cards/local/31_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/31_target.jpg",
    local_probe_img: null,
    tabooWords: ["Lung", "Pleura", "Line", "Sliding", "Chest", "Ribs", "Surface"],
    remote_target_img: "https://cdn.mdedge.com/files/s3fs-public/styles/medium/public/images/em047060276_f1.jpg?itok=NWUWp6_I"
  },
  {
    id: 32,
    prompt: "Place the probe transversely low in the abdomen/pelvis, lateral to the midline, and identify the large muscle deep to the bowel, adjacent to the iliac vessels that you may block for a hip fracture.",
    targetWord: "Psoas Muscle",
    target_img: "images/cards/local/32_target.png",
    probe_img: null,
    local_target_img: "images/cards/local/32_target.png",
    local_probe_img: null,
    tabooWords: ["Psoas", "Muscle", "Iliac", "Pelvis", "Abdomen", "Retroperitoneal", "Hip Flexor"],
    remote_target_img: "https://www.researchgate.net/publication/352146471/figure/fig2/AS:11431281274663142@1725028617666/PENG-block-realization-Needle-approaching-the-psoas-tendon-represents-injection.tif"
  },
  {
    id: 33,
    prompt: "Place the probe transversely on the anterior abdomen just left or right of midline to visualize the large flat muscle with a white tendinous intersection in the center.",
    targetWord: "Rectus Sheath Block View",
    target_img: "images/cards/local/33_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/33_target.jpg",
    local_probe_img: null,
    tabooWords: ["Rectus", "Sheath", "Block", "Linea", "Alba", "Abdomen", "Transversus"],
    remote_target_img: "https://basicultrasonograpy.com/wp-content/uploads/2023/06/Transveresection-of-rectus-sheath-e1689252095462.jpg"
  },
  {
    id: 34,
    prompt: "Place the probe transversely on the lateral neck at the level of the cricoid cartilage, posterior to the sternocleidomastoid (SCM) muscle, to visualize the superficial cervical plexus as it emerges from beneath the posterior border of the SCM.",
    targetWord: "Superficial Cervical Plexus Block View",
    target_img: "images/cards/local/34_target.jpg",
    probe_img: null,
    local_target_img: "images/cards/local/34_target.jpg",
    local_probe_img: null,
    tabooWords: ["Cervical", "Plexus", "Block", "Neck", "SCM", "Muscle", "Nerve"],
    remote_target_img: "https://www.nysora.com/wp-content/uploads/2019/05/ULS.jpg"
  },
  {
    id: 35,
    prompt: "Place your probe transversely on the lateral neck, orienting the indicator towards the patient's right, to visualize the internal jugular vein and carotid artery as you would for a central line.",
    targetWord: "Internal Jugular Vein Cannulation",
    target_img: "images/cards/local/35_target.gif",
    probe_img: null,
    local_target_img: "images/cards/local/35_target.gif",
    local_probe_img: null,
    tabooWords: ["Neck", "Vein", "IJ", "Carotid", "Central", "Line", "Jugular", "Transverse"],
    remote_target_img: "https://www.ultrasoundoftheweek.com/wp-content/uploads/2018/05/IJ-ultrasound.gif"
  }
]; 