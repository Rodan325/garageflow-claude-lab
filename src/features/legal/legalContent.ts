export type LegalDocumentKey = 'legal' | 'privacy' | 'terms' | 'pilotAgreement' | 'dpa'

export interface LegalSection {
  title: string
  paragraphs: string[]
}

export interface LocalizedLegalDocument {
  title: string
  sections: LegalSection[]
}

type LocalizedLegalContent = Record<'en' | 'ar', Record<LegalDocumentKey, LocalizedLegalDocument>>

const en = {
  legal: {
    title: 'Legal notice',
    sections: [
      { title: 'Publisher', paragraphs: ['Clikarage is a service published by RODANBTECH. The official publisher identity, registration details, address and contact information shown below remain authoritative.'] },
      { title: 'Domain, email and hosting', paragraphs: ['The domain and professional email are managed by the providers identified below. The Clikarage application is hosted by Vercel; its database, authentication and technical infrastructure are provided by Supabase in the stated region.'] },
      { title: 'Pilot service', paragraphs: ['The service is in a limited testing phase. Features may change, be suspended or be extended before wider commercial release.'] },
      { title: 'Intellectual property', paragraphs: ['Texts, interfaces, logos, graphics, features, documentation and Clikarage content are protected. Reproduction, extraction, adaptation or reuse requires prior written permission from RODANBTECH.'] },
      { title: 'Liability', paragraphs: ['Clikarage supports appointment requests, vehicles and quotes. It does not provide legal, tax, accounting, automotive or regulatory advice. Each garage remains responsible for its information, quotes, prices, services and client relationship.'] },
      { title: 'Personal data and contracts', paragraphs: ['Personal-data processing is described in the Privacy policy. The Terms of use, Garage pilot terms and Data processing agreement are available from the legal footer.'] },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      { title: '1. Purpose', paragraphs: ['This policy explains how the Clikarage pilot processes personal data to handle appointment requests, vehicles, messages, quotes and quote responses for clients and garages.'] },
      { title: '2. Data controllers and processor', paragraphs: ['A garage controls the data of its own clients. RODANBTECH provides Clikarage as a technical processor for the garage and separately processes the data required for security, maintenance, support and improvement of the pilot.'] },
      { title: '3. Data collected', paragraphs: ['Client data may include identity, contact and account details, vehicle information, requests, messages, quotes, response status and timestamps. Garage data may include its identity, contact details, opening hours, services, users, requests, clients, vehicles, quotes and settings. Limited authentication and security logs are also processed. Passwords are never stored in plain text.'] },
      { title: '4. Prohibited data', paragraphs: ['During the pilot, users must not store registration documents, insurance documents, roadworthiness certificates, invoices, identity documents, bank or payment data, health data, sensitive legal documents or other sensitive material not required for the test. Such information may be removed.'] },
      { title: '5. Purposes', paragraphs: ['Data is used to create accounts; send, process and track requests; confirm appointments; create, send and respond to quotes; provide support; secure the application; prevent abuse; improve the pilot; and meet legal obligations.'] },
      { title: '6. Legal bases', paragraphs: ['Processing relies, as applicable, on performance of the service or pre-contractual steps, legitimate interests in security and support, consent when a client shares vehicle details, and applicable legal obligations.'] },
      { title: '7. Recipients', paragraphs: ['Data is accessible to the person concerned, the garage involved in the request, RODANBTECH for technical operation, and strictly necessary providers such as Supabase and Vercel. Personal data is not sold.'] },
      { title: '8. Retention', paragraphs: ['Account, request and pilot-message data is generally retained for the account or pilot period and may be archived for up to 12 months. Accepted or declined quotes and legal acceptances may be retained for up to five years as evidence. Technical logs are retained for up to 90 days unless a security incident requires longer retention; backup deletion may also take up to 90 days.'] },
      { title: '9. Security', paragraphs: ['Measures include separate client and garage areas, garage-level Row Level Security, isolation tests, Supabase Auth, HTTPS, stronger password rules, secret scanning, data minimisation and no service_role key in the browser.'] },
      { title: '10. Your rights', paragraphs: ['You may request access, correction, deletion, restriction, objection, portability and withdrawal of consent where applicable. Contact the privacy address shown below. You may also complain to the CNIL.'] },
      { title: '11. Cookies', paragraphs: ['The pilot uses no advertising cookies or marketing trackers, only technical mechanisms required for sessions and security. This policy and consent choices will be updated if analytics or marketing tools are added.'] },
      { title: '12. International transfers', paragraphs: ['The Supabase pilot project uses the stated European region. Some providers may be established outside the European Union; contractual safeguards, region selection and supplementary measures will be reviewed before wider release.'] },
      { title: '13. Changes', paragraphs: ['This policy may be updated to reflect changes to the service, legal duties or technical providers.'] },
    ],
  },
  terms: {
    title: 'Terms of use',
    sections: [
      { title: '1. Purpose and definitions', paragraphs: ['These terms govern access to the Clikarage pilot. Clikarage is software published by RODANBTECH for garages and clients to manage requests, vehicles and quotes. A garage user is the automotive professional operating its workspace; an end client is the person making a request or responding to a quote.'] },
      { title: '2. Acceptance', paragraphs: ['Acceptance is explicit and traceable: no box is pre-selected, and the accepted document version and timestamp are logged. Material updates may require renewed acceptance.'] },
      { title: '3. Pilot scope', paragraphs: ['The service is being tested with a deliberately limited scope. Continuous availability is not guaranteed, features may change or stop, and users must not rely on it as an exclusive critical system without human checks.'] },
      { title: '4. Access and accounts', paragraphs: ['Users must provide accurate information, protect their credentials and notify RODANBTECH of unauthorised access.'] },
      { title: '5. Role of RODANBTECH', paragraphs: ['RODANBTECH provides a technical tool. It is not an automotive repairer, garage, insurance broker, vehicle expert, legal or accounting adviser, certified cash-register software, payment provider or trusted automotive expert.'] },
      { title: '6. Garage responsibilities', paragraphs: ['The garage alone is responsible for services, diagnoses, prices, quotes, timescales, repair quality, professional compliance, client relationships, entered information, quote checks and the decision to perform work. Clikarage does not replace accounting, certified till software, legal advice or professional vehicle checks.'] },
      { title: '7. Client responsibilities', paragraphs: ['Clients are responsible for the accuracy of their information and vehicle details, their messages, reading quotes before responding, and avoiding prohibited sensitive data.'] },
      { title: '8. Quotes', paragraphs: ['Clikarage transmits a quote prepared under the garage’s responsibility. The garage checks it before sending and the client reads it before accepting or declining. Responses are timestamped and do not replace the garage’s legal or commercial duties or a separately signed agreement.'] },
      { title: '9. Prohibited data and use', paragraphs: ['Users must not store sensitive documents, bank or payment details, health data, offence data or unnecessary minor data. Unauthorised access, security bypass, mass extraction, abusive reverse engineering, spam, impersonation, false information, unlawful use and abusive or fraudulent content are prohibited.'] },
      { title: '10. Suspension', paragraphs: ['RODANBTECH may suspend access for abuse, security risk, prohibited data, breach of these terms, a legitimate pilot-garage request or the end of the pilot.'] },
      { title: '11. Availability and liability', paragraphs: ['RODANBTECH uses reasonable efforts but does not guarantee uninterrupted, error-free operation, universal compatibility or indefinite retention. Subject to mandatory law, liability is limited to proven direct loss attributable to RODANBTECH; indirect loss, loss of business, garage-client disputes, diagnostic or repair errors, incorrect garage quotes and temporary pilot outages are excluded. This does not exclude gross negligence, wilful misconduct or mandatory consumer rights.'] },
      { title: '12. Evidence and personal data', paragraphs: ['Technical logs, timestamps, statuses and acceptances may evidence the user journey. Personal-data processing is governed by the Privacy policy.'] },
      { title: '13. Intellectual property and changes', paragraphs: ['Clikarage and its interface, text, graphics, features and components are protected. No intellectual-property right is transferred. Material changes to these terms may require renewed acceptance.'] },
      { title: '14. Governing law and contact', paragraphs: ['These terms are governed by French law. Contact RODANBTECH using the details shown below.'] },
    ],
  },
  pilotAgreement: {
    title: 'Garage pilot terms',
    sections: [
      { title: '1. Purpose and parties', paragraphs: ['These terms govern a limited Clikarage pilot between RODANBTECH and the participating professional garage for appointment requests, vehicle details, quotes and client responses. The official provider identity and registered-office information shown below remain unchanged.'] },
      { title: '2. Acceptance and duration', paragraphs: ['The garage accepts through an explicit unchecked box, use of the garage workspace or a separate written agreement. Acceptance, version and time are logged. The standard pilot lasts the number of days stated below; extension requires written or email agreement.'] },
      { title: '3. Included scope', paragraphs: ['The pilot includes receiving and tracking appointment requests, client-provided vehicles, request statuses, quote creation and sending, and client acceptance or refusal.'] },
      { title: '4. Excluded scope', paragraphs: ['It excludes sensitive documents, online payments, qualified electronic signatures, accounting, certified till functions, tax compliance, automotive diagnosis or expertise, mechanical warranties, full insurance management and bulk client imports.'] },
      { title: '5. Financial terms', paragraphs: ['The pilot is free unless otherwise agreed in writing. Any paid setup or service requires a separate written agreement, and Clikarage does not process online payments during the pilot.'] },
      { title: '6. Garage duties', paragraphs: ['The garage must use Clikarage only for the pilot, avoid prohibited data, check every quote, inform staff of pilot status, meet its GDPR duties, answer clients, protect credentials, report incidents, avoid bulk imports without approval and not rely on Clikarage as an exclusive critical tool.'] },
      { title: '7. RODANBTECH duties', paragraphs: ['RODANBTECH provides reasonable access, maintains planned security, does not sell data, assists with export or deletion at pilot end, addresses critical defects within available means and documents pilot limitations.'] },
      { title: '8. Responsibility and cap', paragraphs: ['The garage remains solely responsible for its commercial relationship, quotes, prices, timescales, diagnoses, work, warranties and professional duties. RODANBTECH does not decide whether to repair, invoice, accept, refuse, warrant or diagnose. For a free pilot, total financial liability is capped at EUR 100 except for gross negligence, wilful misconduct or mandatory law; under a separate paid agreement it is capped at amounts paid over the previous three months.'] },
      { title: '9. Confidentiality and data protection', paragraphs: ['Both parties protect non-public information. The garage is controller for its clients and RODANBTECH acts as technical processor under the Data processing agreement.'] },
      { title: '10. End and termination', paragraphs: ['At pilot end, the parties may delete or export data, agree an extension, move to a commercial offer or disable access. Either party may stop by email; RODANBTECH may stop immediately for abuse, security risk, prohibited data or breach.'] },
      { title: '11. Commercial references and law', paragraphs: ['Neither party may publicly use the other’s name as a commercial reference without prior written permission. French law applies.'] },
    ],
  },
  dpa: {
    title: 'Data processing agreement',
    sections: [
      { title: '1. Purpose and roles', paragraphs: ['This agreement governs personal-data processing by RODANBTECH as processor under Article 28 GDPR for a participating garage using Clikarage. The garage is controller for its clients; RODANBTECH is processor for garage instructions and a separate controller for account management, security, any billing and its contractual relationship.'] },
      { title: '2. Documented instructions', paragraphs: ['RODANBTECH processes data only under these terms, reasonable documented garage instructions, technical service needs and applicable law. It may reject or clarify an instruction that appears unlawful or unsafe.'] },
      { title: '3. People and data', paragraphs: ['Data subjects include garage clients, garage and client users, and authorised pilot administrators or testers. Data is limited to identity, contact details, vehicle information, requests, messages, quotes, statuses, timestamps and limited technical logs.'] },
      { title: '4. Prohibited sensitive data', paragraphs: ['No registration, insurance, roadworthiness, invoice, identity, bank, payment, health or sensitive legal document may be entered. The garage must inform its staff and not request such data through Clikarage.'] },
      { title: '5. Purposes and duration', paragraphs: ['Processing is limited to operating Clikarage, handling and tracking requests and quotes, security, maintenance, support, export and deletion. It lasts for the pilot and the reasonable period needed for export, deletion and backup expiry.'] },
      { title: '6. Confidentiality and security', paragraphs: ['Access is limited to people and providers who need it; data is never sold. Measures include garage-level Supabase RLS, separate client and garage access, isolation testing, Supabase Auth, HTTPS, secret scanning, minimisation and no browser service_role key.'] },
      { title: '7. Sub-processors and transfers', paragraphs: ['Supabase provides database, authentication and infrastructure; Vercel hosts the application; an email provider may be added later. RODANBTECH may update providers while maintaining appropriate protection and informing the garage of significant changes. The stated Supabase region is European; safeguards for providers outside the EU will be reviewed before wider release.'] },
      { title: '8. Assistance and incidents', paragraphs: ['RODANBTECH reasonably assists with access, correction, deletion, objection, restriction and portability requests. It informs the garage without undue unreasonable delay after learning of a personal-data incident so the garage can assess its duties.'] },
      { title: '9. End of processing', paragraphs: ['At pilot end, the garage chooses deletion, export or possible anonymisation. Backups may retain data temporarily until deletion under reasonable technical timeframes.'] },
      { title: '10. Audit, evidence and non-reuse', paragraphs: ['On reasonable request, RODANBTECH provides information demonstrating compliance, subject to security, confidentiality and pilot resources. Garage-client data is not reused for RODANBTECH’s own purposes except security, support, legal duties, anonymised or aggregated statistics, or written garage agreement.'] },
      { title: '11. Contact', paragraphs: ['Data-protection requests must be sent to the official privacy contact shown below.'] },
    ],
  },
} satisfies Record<LegalDocumentKey, LocalizedLegalDocument>

const ar = {
  legal: {
    title: 'الإشعارات القانونية',
    sections: [
      { title: 'الناشر', paragraphs: ['Clikarage خدمة تنشرها RODANBTECH. وتظل هوية الناشر الرسمية وبيانات التسجيل والعنوان وبيانات الاتصال المبينة أدناه هي المرجع.'] },
      { title: 'النطاق والبريد والاستضافة', paragraphs: ['يتولى المزودون المبينون أدناه إدارة النطاق والبريد المهني. تستضيف Vercel تطبيق Clikarage، وتوفر Supabase قاعدة البيانات والمصادقة والبنية التقنية في المنطقة المحددة.'] },
      { title: 'الخدمة التجريبية', paragraphs: ['الخدمة في مرحلة اختبار محدودة، وقد تتغير وظائفها أو تتوقف أو تتوسع قبل الإطلاق التجاري الأوسع.'] },
      { title: 'الملكية الفكرية', paragraphs: ['النصوص والواجهات والشعارات والعناصر الرسومية والوظائف والوثائق ومحتوى Clikarage محمية. ويتطلب النسخ أو الاستخراج أو التعديل أو إعادة الاستخدام موافقة كتابية مسبقة من RODANBTECH.'] },
      { title: 'المسؤولية', paragraphs: ['يساعد Clikarage في إدارة طلبات المواعيد والمركبات وعروض الأسعار، ولا يقدم استشارة قانونية أو ضريبية أو محاسبية أو فنية للسيارات أو تنظيمية. وتظل كل ورشة مسؤولة عن معلوماتها وعروضها وأسعارها وخدماتها وعلاقتها بعملائها.'] },
      { title: 'البيانات الشخصية والعقود', paragraphs: ['توضح سياسة الخصوصية معالجة البيانات الشخصية. ويمكن الوصول إلى شروط الاستخدام وشروط البرنامج التجريبي واتفاقية معالجة البيانات من التذييل القانوني.'] },
    ],
  },
  privacy: {
    title: 'سياسة الخصوصية',
    sections: [
      { title: '1. الغرض', paragraphs: ['توضح هذه السياسة كيفية معالجة البيانات الشخصية في نسخة Clikarage التجريبية لإدارة طلبات المواعيد والمركبات والرسائل وعروض الأسعار وردود العملاء.'] },
      { title: '2. المسؤول عن المعالجة والمعالج', paragraphs: ['تكون الورشة مسؤولة عن بيانات عملائها. وتوفر RODANBTECH خدمة Clikarage كمعالج تقني للورشة، وتعالج بصورة مستقلة البيانات اللازمة للأمن والصيانة والدعم وتحسين البرنامج التجريبي.'] },
      { title: '3. البيانات المجمعة', paragraphs: ['قد تشمل بيانات العميل الهوية والاتصال والحساب والمركبة والطلبات والرسائل وعروض الأسعار وحالة الرد والطوابع الزمنية. وقد تشمل بيانات الورشة هويتها واتصالها وساعاتها وخدماتها ومستخدميها وطلباتها وعملاءها ومركباتها وعروضها وإعداداتها، إضافة إلى سجلات مصادقة وأمن محدودة. ولا تُخزن كلمات المرور بنص واضح.'] },
      { title: '4. البيانات المحظورة', paragraphs: ['يُحظر أثناء البرنامج التجريبي تخزين وثائق التسجيل أو التأمين أو الفحص الفني أو الفواتير أو وثائق الهوية أو بيانات البنك والدفع أو الصحة أو الوثائق القانونية الحساسة أو أي مادة حساسة غير لازمة للاختبار، ويجوز حذفها.'] },
      { title: '5. الأغراض', paragraphs: ['تُستخدم البيانات لإنشاء الحسابات وإرسال الطلبات ومعالجتها وتتبعها وتأكيد المواعيد وإنشاء عروض الأسعار وإرسالها والرد عليها وتوفير الدعم وتأمين التطبيق ومنع إساءة الاستخدام وتحسين البرنامج والوفاء بالالتزامات القانونية.'] },
      { title: '6. الأسس القانونية', paragraphs: ['تستند المعالجة بحسب الحالة إلى تنفيذ الخدمة أو إجراءات ما قبل التعاقد، والمصلحة المشروعة في الأمن والدعم، والموافقة عند مشاركة بيانات المركبة، والالتزامات القانونية.'] },
      { title: '7. الجهات المستلمة', paragraphs: ['يمكن لصاحب البيانات والورشة المعنية وRODANBTECH للتشغيل التقني والمزودين الضروريين مثل Supabase وVercel الوصول إلى البيانات. ولا تُباع البيانات الشخصية.'] },
      { title: '8. مدة الاحتفاظ', paragraphs: ['تُحفظ بيانات الحساب والطلبات ورسائل البرنامج عادة طوال مدة الحساب أو البرنامج، وقد تُؤرشف حتى 12 شهرًا. ويمكن حفظ عروض الأسعار المقبولة أو المرفوضة والموافقات القانونية حتى خمس سنوات كدليل. وتُحفظ السجلات التقنية حتى 90 يومًا ما لم يتطلب حادث أمني مدة أطول، وقد يستغرق حذف النسخ الاحتياطية 90 يومًا.'] },
      { title: '9. الأمن', paragraphs: ['تشمل التدابير فصل مساحتي العميل والورشة، وRLS لكل ورشة، واختبارات العزل، وSupabase Auth، وHTTPS، وقواعد كلمات مرور معززة، وفحص الأسرار، وتقليل البيانات، وعدم وجود مفتاح service_role في المتصفح.'] },
      { title: '10. حقوقك', paragraphs: ['يمكنك طلب الوصول والتصحيح والحذف والتقييد والاعتراض وقابلية النقل وسحب الموافقة عند الاقتضاء. استخدم عنوان الخصوصية أدناه، ويمكنك كذلك تقديم شكوى إلى CNIL.'] },
      { title: '11. ملفات الارتباط', paragraphs: ['لا يستخدم البرنامج ملفات إعلانية أو أدوات تتبع تسويقية، بل الآليات التقنية اللازمة للجلسات والأمن فقط. وستُحدث السياسة وخيارات الموافقة إذا أضيفت أدوات تحليل أو تسويق.'] },
      { title: '12. النقل الدولي', paragraphs: ['يستخدم مشروع Supabase المنطقة الأوروبية المحددة. وقد يكون بعض المزودين خارج الاتحاد الأوروبي، وستُراجع الضمانات التعاقدية واختيار المنطقة والتدابير الإضافية قبل الإطلاق الأوسع.'] },
      { title: '13. التعديلات', paragraphs: ['قد تُحدث هذه السياسة لتعكس تطور الخدمة أو الالتزامات القانونية أو المزودين التقنيين.'] },
    ],
  },
  terms: {
    title: 'شروط الاستخدام',
    sections: [
      { title: '1. الغرض والتعريفات', paragraphs: ['تنظم هذه الشروط الوصول إلى نسخة Clikarage التجريبية. وClikarage برنامج تنشره RODANBTECH للورش والعملاء لإدارة الطلبات والمركبات وعروض الأسعار. والورشة المستخدمة هي المهني الذي يدير مساحته، والعميل النهائي هو من يرسل طلبًا أو يرد على عرض سعر.'] },
      { title: '2. القبول', paragraphs: ['القبول صريح وقابل للتتبع؛ فلا تُحدد أي خانة مسبقًا، ويُسجل إصدار المستند المقبول وتوقيته. وقد تتطلب التغييرات الجوهرية قبولًا جديدًا.'] },
      { title: '3. نطاق البرنامج التجريبي', paragraphs: ['الخدمة قيد الاختبار بنطاق محدود عمدًا. ولا يُضمن توفرها المستمر، وقد تتغير وظائفها أو تتوقف، ولا يجوز الاعتماد عليها كنظام حرج وحيد من دون تحقق بشري.'] },
      { title: '4. الوصول والحسابات', paragraphs: ['يجب تقديم معلومات صحيحة وحماية بيانات الدخول وإبلاغ RODANBTECH بأي وصول غير مصرح به.'] },
      { title: '5. دور RODANBTECH', paragraphs: ['توفر RODANBTECH أداة تقنية، وليست مصلح سيارات أو ورشة أو وسيط تأمين أو خبير مركبات أو مستشارًا قانونيًا أو محاسبيًا أو برنامج صندوق معتمدًا أو مزود دفع أو خبيرًا فنيًا موثوقًا للسيارات.'] },
      { title: '6. مسؤوليات الورشة', paragraphs: ['تتحمل الورشة وحدها مسؤولية الخدمات والتشخيص والأسعار والعروض والمواعيد وجودة الإصلاح والامتثال المهني وعلاقات العملاء والمعلومات المدخلة والتحقق من العروض وقرار تنفيذ العمل. ولا يحل Clikarage محل المحاسبة أو برنامج الصندوق المعتمد أو الاستشارة القانونية أو الفحص المهني.'] },
      { title: '7. مسؤوليات العميل', paragraphs: ['يتحمل العميل مسؤولية صحة معلوماته وبيانات مركبته ورسائله وقراءة العرض قبل الرد وعدم إدخال البيانات الحساسة المحظورة.'] },
      { title: '8. عروض الأسعار', paragraphs: ['ينقل Clikarage عرضًا أعدته الورشة تحت مسؤوليتها. وتراجعه الورشة قبل الإرسال ويقرأه العميل قبل القبول أو الرفض. ويُسجل الرد بالتاريخ والوقت ولا يحل محل واجبات الورشة أو اتفاق موقع بصورة منفصلة.'] },
      { title: '9. البيانات والاستخدامات المحظورة', paragraphs: ['يُحظر تخزين الوثائق الحساسة أو بيانات البنك والدفع أو الصحة أو الجرائم أو بيانات القاصرين غير اللازمة. كما يُحظر الوصول غير المصرح به وتجاوز الأمن والاستخراج الجماعي والهندسة العكسية المسيئة والرسائل المزعجة وانتحال الهوية والمعلومات الكاذبة والاستخدام غير القانوني والمحتوى المسيء أو الاحتيالي.'] },
      { title: '10. التعليق', paragraphs: ['يجوز لـ RODANBTECH تعليق الوصول بسبب إساءة الاستخدام أو خطر أمني أو بيانات محظورة أو مخالفة الشروط أو طلب مشروع من ورشة مشاركة أو انتهاء البرنامج.'] },
      { title: '11. التوفر والمسؤولية', paragraphs: ['تبذل RODANBTECH جهودًا معقولة لكنها لا تضمن تشغيلًا مستمرًا بلا أخطاء أو توافقًا شاملًا أو حفظًا غير محدود. وفي حدود القانون الإلزامي تقتصر المسؤولية على الضرر المباشر المثبت المنسوب إليها، وتُستبعد الأضرار غير المباشرة وخسائر الأعمال ونزاعات الورشة والعميل وأخطاء التشخيص أو الإصلاح والعروض الخاطئة والتوقف المؤقت. ولا يمس ذلك الإهمال الجسيم أو العمد أو حقوق المستهلك الإلزامية.'] },
      { title: '12. الإثبات والبيانات', paragraphs: ['يمكن استخدام السجلات والطوابع الزمنية والحالات والموافقات كدليل على مسار المستخدم. وتخضع البيانات الشخصية لسياسة الخصوصية.'] },
      { title: '13. الملكية والتعديل', paragraphs: ['Clikarage وواجهته ونصوصه ورسوماته ووظائفه ومكوناته محمية ولا ينتقل أي حق ملكية فكرية. وقد تتطلب التعديلات الجوهرية قبولًا جديدًا.'] },
      { title: '14. القانون والاتصال', paragraphs: ['تخضع الشروط للقانون الفرنسي. ويمكن التواصل مع RODANBTECH عبر البيانات المبينة أدناه.'] },
    ],
  },
  pilotAgreement: {
    title: 'شروط البرنامج التجريبي للورش',
    sections: [
      { title: '1. الغرض والأطراف', paragraphs: ['تنظم هذه الشروط برنامج Clikarage التجريبي المحدود بين RODANBTECH والورشة المهنية المشاركة لإدارة الطلبات والمركبات وعروض الأسعار وردود العملاء. وتظل هوية المزود الرسمية وعنوانه المسجل المبينان أدناه من دون تغيير.'] },
      { title: '2. القبول والمدة', paragraphs: ['تقبل الورشة عبر خانة صريحة غير محددة مسبقًا أو استخدام مساحة الورشة أو اتفاق كتابي منفصل. ويُسجل القبول والإصدار والتوقيت. وتستمر المدة القياسية بعدد الأيام المبين أدناه، ولا تمدد إلا باتفاق كتابي أو بالبريد.'] },
      { title: '3. النطاق المشمول', paragraphs: ['يشمل البرنامج تلقي طلبات المواعيد وتتبعها، ومركبات العملاء، وحالات الطلبات، وإنشاء عروض الأسعار وإرسالها، وقبول العميل أو رفضه.'] },
      { title: '4. النطاق المستبعد', paragraphs: ['لا يشمل الوثائق الحساسة أو الدفع الإلكتروني أو التوقيع الإلكتروني المؤهل أو المحاسبة أو الصندوق المعتمد أو الامتثال الضريبي أو تشخيص السيارات وخبرتها أو الضمان الميكانيكي أو إدارة التأمين الكاملة أو الاستيراد الجماعي للعملاء.'] },
      { title: '5. الشروط المالية', paragraphs: ['البرنامج مجاني ما لم يوجد اتفاق كتابي مخالف. وتتطلب أي خدمة مدفوعة اتفاقًا منفصلًا، ولا يعالج Clikarage مدفوعات إلكترونية أثناء البرنامج.'] },
      { title: '6. التزامات الورشة', paragraphs: ['تستخدم الورشة Clikarage للبرنامج فقط، وتتجنب البيانات المحظورة، وتراجع كل عرض، وتبلغ فريقها بالطابع التجريبي، وتلتزم بواجبات GDPR، وتجيب العملاء، وتحمي بيانات الدخول، وتبلغ الحوادث، وتتجنب الاستيراد الجماعي دون موافقة، ولا تعتمد عليه كأداة حرجة وحيدة.'] },
      { title: '7. التزامات RODANBTECH', paragraphs: ['توفر RODANBTECH وصولًا معقولًا وتحافظ على تدابير الأمن ولا تبيع البيانات وتساعد في التصدير أو الحذف وتعالج الأعطال الحرجة ضمن إمكاناتها وتوثق حدود البرنامج.'] },
      { title: '8. المسؤولية والحد المالي', paragraphs: ['تظل الورشة مسؤولة وحدها عن علاقتها التجارية والعروض والأسعار والمواعيد والتشخيص والعمل والضمانات والواجبات المهنية. ولا تقرر RODANBTECH الإصلاح أو الفوترة أو القبول أو الرفض أو الضمان أو التشخيص. وفي البرنامج المجاني يحد إجمالي المسؤولية المالية بمبلغ 100 يورو باستثناء الإهمال الجسيم أو العمد أو القانون الإلزامي؛ وفي اتفاق مدفوع منفصل يحد بما دُفع خلال الأشهر الثلاثة السابقة.'] },
      { title: '9. السرية وحماية البيانات', paragraphs: ['يحمي الطرفان المعلومات غير العامة. وتكون الورشة مسؤولة عن بيانات عملائها وتعمل RODANBTECH كمعالج تقني وفق اتفاقية معالجة البيانات.'] },
      { title: '10. الانتهاء والفسخ', paragraphs: ['عند انتهاء البرنامج يمكن حذف البيانات أو تصديرها أو تمديد البرنامج أو الانتقال إلى عرض تجاري أو تعطيل الوصول. ويجوز لكل طرف الإنهاء بالبريد، ولـ RODANBTECH الإنهاء الفوري بسبب الإساءة أو الخطر الأمني أو البيانات المحظورة أو المخالفة.'] },
      { title: '11. المراجع التجارية والقانون', paragraphs: ['لا يستخدم أي طرف اسم الآخر علنًا كمرجع تجاري دون موافقة كتابية مسبقة. ويطبق القانون الفرنسي.'] },
    ],
  },
  dpa: {
    title: 'اتفاقية معالجة البيانات',
    sections: [
      { title: '1. الغرض والأدوار', paragraphs: ['تنظم الاتفاقية معالجة RODANBTECH للبيانات بصفتها معالجًا وفق المادة 28 من GDPR لصالح ورشة مشاركة تستخدم Clikarage. وتكون الورشة مسؤولة عن بيانات عملائها، وتكون RODANBTECH معالجًا لتعليماتها ومسؤولًا مستقلًا لإدارة الحساب والأمن وأي فوترة والعلاقة التعاقدية.'] },
      { title: '2. التعليمات الموثقة', paragraphs: ['لا تعالج RODANBTECH البيانات إلا وفق هذه الشروط وتعليمات الورشة المعقولة والموثقة والاحتياجات التقنية والقانون. ويجوز لها رفض أو توضيح التعليمات التي تبدو غير قانونية أو خطرة.'] },
      { title: '3. الأشخاص والبيانات', paragraphs: ['يشمل أصحاب البيانات عملاء الورشة ومستخدمي مساحتي الورشة والعميل والمشرفين أو المختبرين المصرح لهم. وتقتصر البيانات على الهوية والاتصال والمركبة والطلبات والرسائل والعروض والحالات والطوابع الزمنية والسجلات التقنية المحدودة.'] },
      { title: '4. البيانات الحساسة المحظورة', paragraphs: ['يُحظر إدخال وثائق التسجيل أو التأمين أو الفحص أو الفواتير أو الهوية أو البنك أو الدفع أو الصحة أو الوثائق القانونية الحساسة، وعلى الورشة إبلاغ فريقها وعدم طلبها عبر Clikarage.'] },
      { title: '5. الأغراض والمدة', paragraphs: ['تقتصر المعالجة على تشغيل Clikarage وإدارة الطلبات والعروض والأمن والصيانة والدعم والتصدير والحذف، وتستمر طوال البرنامج والفترة المعقولة اللازمة للتصدير والحذف وانتهاء النسخ الاحتياطية.'] },
      { title: '6. السرية والأمن', paragraphs: ['يقتصر الوصول على من يحتاج إليه ولا تُباع البيانات. وتشمل التدابير RLS لكل ورشة وفصل الوصول واختبارات العزل وSupabase Auth وHTTPS وفحص الأسرار وتقليل البيانات وعدم وجود مفتاح service_role في المتصفح.'] },
      { title: '7. المعالجون اللاحقون والنقل', paragraphs: ['توفر Supabase قاعدة البيانات والمصادقة والبنية، وتستضيف Vercel التطبيق، وقد يضاف مزود بريد لاحقًا. ويجوز تحديث المزودين مع الحفاظ على الحماية وإبلاغ الورشة بالتغييرات المهمة. والمنطقة المحددة لـ Supabase أوروبية، وستُراجع ضمانات المزودين خارج الاتحاد قبل الإطلاق الأوسع.'] },
      { title: '8. المساعدة والحوادث', paragraphs: ['تساعد RODANBTECH بصورة معقولة في طلبات الوصول والتصحيح والحذف والاعتراض والتقييد والنقل، وتبلغ الورشة دون تأخير غير معقول بعد العلم بحادث بيانات كي تقيّم التزاماتها.'] },
      { title: '9. نهاية المعالجة', paragraphs: ['عند نهاية البرنامج تختار الورشة الحذف أو التصدير أو إخفاء الهوية عند الإمكان، وقد تحتفظ النسخ الاحتياطية بالبيانات مؤقتًا حتى حذفها ضمن آجال تقنية معقولة.'] },
      { title: '10. التدقيق والإثبات وعدم إعادة الاستخدام', paragraphs: ['توفر RODANBTECH عند طلب معقول معلومات تثبت الامتثال ضمن حدود الأمن والسرية وإمكانات البرنامج. ولا تعيد استخدام بيانات عملاء الورشة لحسابها إلا للأمن أو الدعم أو الالتزام القانوني أو الإحصاءات المجهولة أو المجمعة أو بموافقة كتابية من الورشة.'] },
      { title: '11. الاتصال', paragraphs: ['تُرسل طلبات حماية البيانات إلى جهة اتصال الخصوصية الرسمية المبينة أدناه.'] },
    ],
  },
} satisfies Record<LegalDocumentKey, LocalizedLegalDocument>

// The complete French reference remains in the original document components.
export const legalContent: LocalizedLegalContent = { en, ar }
