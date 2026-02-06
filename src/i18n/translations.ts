export const translations = {
  en: {
    // Nav
    home: "Home",
    bookings: "Bookings",
    messages: "Messages",
    profile: "Profile",
    
    // Auth
    login: "Log In",
    signUp: "Sign Up",
    email: "Email",
    password: "Password",
    fullName: "Full Name",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    registerAsUser: "I want to train",
    registerAsPartner: "I offer trainings",
    
    // Partner
    individualTrainer: "Individual Trainer",
    gymOrStudio: "Gym / Studio / Place",
    displayName: "Display Name",
    bio: "Bio",
    location: "Location",
    sports: "Sports & Activities",
    spokenLanguages: "Languages Spoken",
    partnerType: "Partner Type",
    
    // Listings
    search: "Search trainings...",
    filters: "Filters",
    sport: "Sport",
    dateTime: "Date & Time",
    priceRange: "Price Range",
    trainingType: "Training Type",
    language: "Language",
    oneOnOne: "1-on-1",
    group: "Group",
    event: "Event",
    book: "Book",
    askQuestion: "Ask a Question",
    spotsLeft: "spots left",
    verified: "Verified",
    gel: "GEL",
    noListings: "No trainings found",
    
    // Status
    draft: "Draft",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    
    // General
    save: "Save",
    cancel: "Cancel",
    submit: "Submit",
    edit: "Edit",
    delete: "Delete",
    loading: "Loading...",
    logOut: "Log Out",
    settings: "Settings",
    languageLabel: "Language",
    loginRequired: "Please log in to continue",
    loginToBook: "Log in to book this training",
    loginToChat: "Log in to send a message",
  },
  ka: {
    // Nav
    home: "მთავარი",
    bookings: "ჯავშნები",
    messages: "შეტყობინებები",
    profile: "პროფილი",
    
    // Auth
    login: "შესვლა",
    signUp: "რეგისტრაცია",
    email: "ელფოსტა",
    password: "პაროლი",
    fullName: "სრული სახელი",
    forgotPassword: "დაგავიწყდათ პაროლი?",
    noAccount: "არ გაქვთ ანგარიში?",
    hasAccount: "უკვე გაქვთ ანგარიში?",
    registerAsUser: "მინდა ვივარჯიშო",
    registerAsPartner: "ვთავაზობ ვარჯიშებს",
    
    // Partner
    individualTrainer: "ინდივიდუალური ტრენერი",
    gymOrStudio: "სპორტდარბაზი / სტუდია",
    displayName: "სახელი",
    bio: "ბიო",
    location: "მდებარეობა",
    sports: "სპორტი და აქტივობები",
    spokenLanguages: "საუბრის ენები",
    partnerType: "პარტნიორის ტიპი",
    
    // Listings
    search: "მოძებნე ვარჯიშები...",
    filters: "ფილტრები",
    sport: "სპორტი",
    dateTime: "თარიღი და დრო",
    priceRange: "ფასის დიაპაზონი",
    trainingType: "ვარჯიშის ტიპი",
    language: "ენა",
    oneOnOne: "1-1",
    group: "ჯგუფური",
    event: "ღონისძიება",
    book: "დაჯავშნე",
    askQuestion: "დასვი კითხვა",
    spotsLeft: "ადგილი დარჩა",
    verified: "დამოწმებული",
    gel: "₾",
    noListings: "ვარჯიშები ვერ მოიძებნა",
    
    // Status
    draft: "მონახაზი",
    pending: "განხილვაში",
    approved: "დამტკიცებული",
    rejected: "უარყოფილი",
    
    // General
    save: "შენახვა",
    cancel: "გაუქმება",
    submit: "გაგზავნა",
    edit: "რედაქტირება",
    delete: "წაშლა",
    loading: "იტვირთება...",
    logOut: "გასვლა",
    settings: "პარამეტრები",
    languageLabel: "ენა",
    loginRequired: "გთხოვთ შეხვიდეთ გასაგრძელებლად",
    loginToBook: "შეხვიდეთ ვარჯიშის დასაჯავშნად",
    loginToChat: "შეხვიდეთ შეტყობინების გასაგზავნად",
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
