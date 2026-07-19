import { Navigate, Route, Routes } from 'react-router-dom'
import { MarketingShell } from '@/components/shells/MarketingShell'
import { ProShell } from '@/components/shells/ProShell'
import { ClientShell } from '@/components/shells/ClientShell'
import { RequireClientAuth, RequireStaff } from '@/features/auth/guards'
import { DemoBanner } from '@/components/common/DemoBanner'
import { DemoNotice } from '@/components/common/DemoNotice'
import { ScrollToTop } from '@/components/common/ScrollToTop'
import { BrandDemoEntry } from '@/features/demo/BrandDemoEntry'

// Marketing
import { HomePage } from '@/features/marketing/HomePage'
import { SolutionsPage } from '@/features/marketing/SolutionsPage'
// Auth
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
import { VerifyEmailPage } from '@/features/auth/VerifyEmailPage'
// Pro
import { DashboardPage } from '@/features/pro/DashboardPage'
import { BookingsPage } from '@/features/pro/BookingsPage'
import { CalendarPage } from '@/features/pro/CalendarPage'
import { VehiclesPage } from '@/features/pro/VehiclesPage'
import { ClientsPage } from '@/features/pro/ClientsPage'
import { WorkshopPage } from '@/features/pro/WorkshopPage'
import { QuotesPage } from '@/features/pro/QuotesPage'
import { QuoteEditorPage } from '@/features/pro/QuoteEditorPage'
import { QuotePrintPage } from '@/features/pro/QuotePrintPage'
import { ServicesPage } from '@/features/pro/ServicesPage'
import { TeamPage } from '@/features/pro/TeamPage'
import { SettingsPage } from '@/features/pro/SettingsPage'
import { RecommendationsPage } from '@/features/recommendations/RecommendationsPage'
import { NotificationsPage } from '@/features/notifications/NotificationsPage'
import { DeliveryReportPage } from '@/features/reports/DeliveryReportPage'
import { RemindersPage } from '@/features/reminders/RemindersPage'
import { NetworkDashboardPage } from '@/features/network/NetworkDashboardPage'
import { IntegrationsPage } from '@/features/integrations/IntegrationsPage'
// Client
import { ClientHomePage } from '@/features/client/ClientHomePage'
import { ClientNewsPage } from '@/features/client/ClientNewsPage'
import { BookingFlow } from '@/features/client/booking/BookingFlow'
import { ClientBookingsPage } from '@/features/client/ClientBookingsPage'
import { ClientBookingDetailPage } from '@/features/client/ClientBookingDetailPage'
import { ClientVehiclesPage } from '@/features/client/ClientVehiclesPage'
import { ClientProfilePage } from '@/features/client/ClientProfilePage'
import { ClientQuotePage } from '@/features/client/ClientQuotePage'
// Legal (public)
import { LegalPage } from '@/features/legal/LegalPage'
import { PrivacyPage } from '@/features/legal/PrivacyPage'
import { TermsPage } from '@/features/legal/TermsPage'
import { PilotAgreementPage } from '@/features/legal/PilotAgreementPage'
import { DpaPage } from '@/features/legal/DpaPage'
import { LegalStatusPage } from '@/features/legal/LegalStatusPage'
import { LegalV2Route } from '@/features/legal/LegalV2Route'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'

export function App() {
  return (
    <>
      <ScrollToTop />
      <DemoNotice />
      <DemoBanner />
      <Routes>
        <Route path="/demo/:brand" element={<BrandDemoEntry />} />
        <Route path="/" element={<MarketingShell><HomePage /></MarketingShell>} />
        <Route path="/solutions" element={<MarketingShell><SolutionsPage /></MarketingShell>} />
        <Route path="/pilote" element={<Navigate to="/solutions" replace />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route path="/pro" element={<RequireStaff><ProShell /></RequireStaff>}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="workshop" element={<WorkshopPage />} />
          <Route path="workshop/:requestId/recommendations" element={<RecommendationsPage />} />
          <Route path="workshop/:requestId/report" element={<DeliveryReportPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="reminders" element={<RemindersPage />} />
          <Route path="network" element={<NetworkDashboardPage />} />
          <Route path="integrations" element={<IntegrationsPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/new" element={<QuoteEditorPage />} />
          <Route path="quotes/:id" element={<QuoteEditorPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="legal-status" element={<LegalStatusPage />} />
        </Route>

        <Route path="/print/quote/:id" element={<RequireStaff><QuotePrintPage /></RequireStaff>} />

        {/* Public, tokenised quote consultation (no login required) */}
        <Route path="/devis/:token" element={<ClientQuotePage />} />

        {/* Legal pages (public, no login required) */}
        <Route path="/legal" element={<LegalPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/terms/pro" element={<LegalV2Route documentId="terms_pro" />} />
        <Route path="/terms/client" element={<LegalV2Route documentId="terms_client" />} />
        <Route path="/cookies" element={<LegalV2Route documentId="cookies" />} />
        <Route path="/subprocessors" element={<LegalV2Route documentId="subprocessors" />} />
        <Route path="/security" element={<LegalV2Route documentId="security" />} />
        <Route path="/service-levels" element={<LegalV2Route documentId="service_levels" />} />
        <Route path="/ai-policy" element={<LegalV2Route documentId="ai_policy" />} />
        <Route path="/pilot-agreement" element={<PilotAgreementPage />} />
        <Route path="/dpa" element={<DpaPage />} />

        <Route path="/app" element={<ClientShell />}>
          <Route index element={<ClientHomePage />} />
          <Route path="news" element={<ClientNewsPage />} />
          <Route path="book" element={<BookingFlow />} />
          <Route path="bookings" element={<RequireClientAuth><ClientBookingsPage /></RequireClientAuth>} />
          <Route path="bookings/:id" element={<RequireClientAuth><ClientBookingDetailPage /></RequireClientAuth>} />
          <Route path="vehicles" element={<RequireClientAuth><ClientVehiclesPage /></RequireClientAuth>} />
          <Route path="profile" element={<RequireClientAuth><ClientProfilePage /></RequireClientAuth>} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}
