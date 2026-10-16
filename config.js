// Site configuration — CMS settings (edit here, no code changes needed)
const SITE_CONFIG = {
  name: "أسامة بن محمد دحيان",
  shortName: "أسامة دحيان",
  latinName: "Osama Dahyan",
  tagline: "الإنسان أولًا، والتقنية لخدمته.",
  baseUrl: "",
  locale: "ar-YE",
  // WhatsApp: local number + country code kept separate per requirement
  whatsapp: {
    countryCode: "967",      // Yemen — change here if needed
    localNumber: "730143224",
    get full() { return this.countryCode + this.localNumber; },
    get link() { return "https://wa.me/" + this.full + "?text=" + encodeURIComponent("مرحبًا أسامة، لدي فكرة مشروع وأود الحديث معك."); }
  },
  social: {
    instagram: "https://instagram.com/osama_s70",
    facebook: "https://facebook.com/osama_s70",
    x: "https://x.com/osama_s70"
  },
  email: "hello@osamadahyan.com"
};
