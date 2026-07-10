import type { Messages } from './fr'

/** Arabic dictionary (RTL). Mirrors the keys of `fr` (typed against `Messages`). */
export const ar: Messages = {
  lang: { label: 'اللغة', fr: 'Français', en: 'English', ar: 'العربية' },

  common: {
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
  },

  authErrors: {
    emailInUse:
      'قد يكون هناك حساب مسجّل بهذا البريد بالفعل. جرّب تسجيل الدخول أو إعادة تعيين كلمة المرور.',
    emailNotConfirmed: 'يرجى تأكيد بريدك الإلكتروني قبل تسجيل الدخول.',
    network: 'تعذّر الاتصال بالخدمة. يرجى المحاولة مرة أخرى بعد قليل.',
    generic: 'حدث خطأ ما. يرجى المحاولة مرة أخرى بعد قليل.',
  },

  login: {
    title: 'تسجيل الدخول',
    subtitle: 'مساحة الورشة أو حساب العميل.',
    asideHeading: 'استقبل طلبات المواعيد عبر الإنترنت وأدرها ببضع نقرات.',
    asideSubtitle: 'طلبات مركزية، أجندة منظّمة، متابعة العملاء.',
    demoGarage: 'تجربة الورشة',
    demoClient: 'تجربة العميل',
    withoutSupabase: 'بدون Supabase',
    orWithSupabase: 'أو باستخدام حساب Supabase',
    prefillGarage: 'تعبئة بيانات الورشة',
    prefillClient: 'تعبئة بيانات العميل',
    emailPlaceholder: 'you@garage.com',
    submit: 'تسجيل الدخول',
    noAccount: 'ليس لديك حساب عميل بعد؟',
    createAccountLink: 'إنشاء حساب',
    errorTitle: 'تعذّر تسجيل الدخول',
    invalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
  },

  signup: {
    title: 'إنشاء حساب عميل',
    subtitle: 'لحجز مواعيدك في الورشة ومتابعتها.',
    fullName: 'الاسم الكامل',
    fullNamePlaceholder: 'Julie Durand',
    emailPlaceholder: 'you@email.com',
    emailConfirm: 'تأكيد البريد الإلكتروني',
    phone: 'الهاتف',
    phoneHint: 'اختياري — مفيد للتواصل معك بخصوص موعد.',
    phonePlaceholder: '06 12 34 56 78',
    passwordHint: 'استخدم 12 حرفًا على الأقل. عبارة مرور طويلة هي الأفضل.',
    passwordPlaceholder: 'عبارة مرور يسهل عليك تذكّرها',
    passwordConfirm: 'تأكيد كلمة المرور',
    passwordConfirmPlaceholder: 'أعد إدخال كلمة المرور',
    strengthStrong: 'قوية',
    strengthMedium: 'متوسطة',
    strengthWeak: 'ضعيفة',
    submit: 'إنشاء حسابي',
    horodatage: 'يتم تسجيل موافقتك مع التاريخ والوقت وحفظها في سجل الموافقات.',
    alreadyMember: 'مسجّل بالفعل؟',
    loginLink: 'تسجيل الدخول',
    createdTitle: 'تم إنشاء الحساب',
    createdBody: 'مرحبًا بك في GarageFlow.',
    errorTitle: 'تعذّر إنشاء الحساب',
  },

  verifyEmail: {
    title: 'تأكيد بريدك الإلكتروني',
    bodyPrefix: 'أرسلنا رابط تأكيد إلى: ',
    bodyFallbackAddress: 'بريدك الإلكتروني',
    bodySuffix: '. انقر على الرابط الذي وصلك لتفعيل حسابك، ثم سجّل الدخول.',
    goToLogin: 'الذهاب إلى تسجيل الدخول',
    resend: 'إعادة إرسال البريد',
    backHome: 'العودة إلى الصفحة الرئيسية',
    spamHint: 'لم تجد البريد؟ تذكّر التحقق من مجلد الرسائل غير المرغوب فيها.',
    resendErrorTitle: 'تعذّر الإرسال',
    resendOkTitle: 'تمت إعادة إرسال البريد',
    resendOkBody: 'تحقق من صندوق الوارد (ومجلد الرسائل غير المرغوب فيها).',
  },
}
