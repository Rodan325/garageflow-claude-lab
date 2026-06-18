import { Route, Routes } from 'react-router-dom'
import { MarketingShell } from '@/components/shells/MarketingShell'
import { ProShell } from '@/components/shells/ProShell'
import { ClientShell } from '@/components/shells/ClientShell'
import { RequireClientAuth, RequireStaff } from '@/features/auth/guards'
import { ConfigBanner } from '@/components/common/ConfigBanner'
import { DemoBanner } from '@/components/common/DemoBanner'

// Marketing
import { HomePage } from '@/features/marketing/HomePage'
import { PilotPage } from '@/features/marketing/PilotPage'
// Auth
import { LoginPage } from '@/features/auth/LoginPage'
import { SignupPage } from '@/features/auth/SignupPage'
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
// Client
import { ClientHomePage } from '@/features/client/ClientHomePage'
import { ClientNewsPage } from '@/features/client/ClientNewsPage'
import { BookingFlow } from '@/features/client/booking/BookingFlow'
import { ClientBookingsPage } from '@/features/client/ClientBookingsPage'
import { ClientBookingDetailPage } from '@/features/client/ClientBookingDetailPage'
import { ClientVehiclesPage } from '@/features/client/ClientVehiclesPage'
import { ClientProfilePage } from '@/features/client/ClientProfilePage'
import { ClientQuotePage } from '@/features/client/ClientQuotePage'
import { NotFoundPage } from '@/features/marketing/NotFoundPage'

export function App() {
  return (
    <>
      <ConfigBanner />
      <DemoBanner />
      <Routes>
        <Route path="/" element={<MarketingShell><HomePage /></MarketingShell>} />
        <Route path="/pilote" element={<MarketingShell><PilotPage /></MarketingShell>} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route path="/pro" element={<RequireStaff><ProShell /></RequireStaff>}>
          <Route index element={<DashboardPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="vehicles" element={<VehiclesPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="workshop" element={<WorkshopPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="quotes" element={<QuotesPage />} />
          <Route path="quotes/new" element={<QuoteEditorPage />} />
          <Route path="quotes/:id" element={<QuoteEditorPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/print/quote/:id" element={<RequireStaff><QuotePrintPage /></RequireStaff>} />

        {/* Public, tokenised quote consultation (no login required) */}
        <Route path="/devis/:token" element={<ClientQuotePage />} />

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
