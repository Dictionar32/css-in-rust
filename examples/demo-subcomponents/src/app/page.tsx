'use client'

import { Button, SecondaryButton, DangerButton, OutlineButton } from '@/components/Button'
import { Card, PrimaryCard, ElevatedCard } from '@/components/Card'
import { InfoAlert, SuccessAlert, WarningAlert, ErrorAlert } from '@/components/Alert'
import { tw } from 'tailwind-styled-v4'

// Layout components
const PageRoot = tw.div({
  base: "max-w-4xl mx-auto py-12 px-4 space-y-8"
})

const Header = tw.div({
  base: "text-center"
})

const PageTitle = tw.h1({
  base: "text-3xl font-bold text-gray-900"
})

const PageSubtitle = tw.p({
  base: "text-gray-600 mt-2"
})

const ButtonGrid = tw.div({
  base: "flex flex-wrap gap-4"
})

const CardGrid = tw.div({
  base: "grid md:grid-cols-3 gap-6"
})

const AlertsContainer = tw.div({
  base: "space-y-3"
})

export default function DemoPage() {
  return (
    <PageRoot>

      {/* Header */}
      <Header>
        <PageTitle>tailwind-styled-v4 Demo</PageTitle>
        <PageSubtitle>
          The first explainable styling system — inspect, don't debug.
        </PageSubtitle>
      </Header>

      {/* Buttons Section */}
      <Card>
        <Card.header>Buttons with Sub-components</Card.header>
        <Card.body>
          <ButtonGrid>
            <Button>
              <Button.icon>🔵</Button.icon>
              <Button.text>Primary Button</Button.text>
              <Button.badge>New</Button.badge>
            </Button>

            <SecondaryButton>
              <SecondaryButton.icon>⚪</SecondaryButton.icon>
              <SecondaryButton.text>Secondary</SecondaryButton.text>
            </SecondaryButton>

            <DangerButton>
              <DangerButton.icon>🔴</DangerButton.icon>
              <DangerButton.text>Danger</DangerButton.text>
            </DangerButton>

            <OutlineButton>
              <OutlineButton.icon>✨</OutlineButton.icon>
              <OutlineButton.text>Outline</OutlineButton.text>
            </OutlineButton>
          </ButtonGrid>
        </Card.body>
      </Card>

      {/* Cards Section */}
      <CardGrid>
        <Card>
          <Card.image src="/api/placeholder/400/200" alt="Placeholder" />
          <Card.header>Default Card</Card.header>
          <Card.body>
            Standard card with header, body, and footer.
          </Card.body>
          <Card.footer>Last updated 2 min ago</Card.footer>
        </Card>

        <PrimaryCard>
          <PrimaryCard.header>Primary Card</PrimaryCard.header>
          <PrimaryCard.body>
            Highlighted card with primary color scheme.
          </PrimaryCard.body>
          <PrimaryCard.footer>Recommended</PrimaryCard.footer>
        </PrimaryCard>

        <ElevatedCard>
          <ElevatedCard.header>Elevated Card</ElevatedCard.header>
          <ElevatedCard.body>
            Card with shadow elevation for prominence.
          </ElevatedCard.body>
          <ElevatedCard.footer>Premium</ElevatedCard.footer>
        </ElevatedCard>

      </CardGrid>

      {/* Alerts Section */}
      <Card>
        <Card.header>Alert Messages with Sub-components</Card.header>
        <Card.body>
          <AlertsContainer>
            <InfoAlert>
              <InfoAlert.icon>ℹ️</InfoAlert.icon>
              <InfoAlert.content>
                <InfoAlert.title>Information</InfoAlert.title>
                <InfoAlert.message>This is an informational message.</InfoAlert.message>
              </InfoAlert.content>
              <InfoAlert.close>✕</InfoAlert.close>
            </InfoAlert>

            <SuccessAlert>
              <SuccessAlert.icon>✅</SuccessAlert.icon>
              <SuccessAlert.content>
                <SuccessAlert.title>Success!</SuccessAlert.title>
                <SuccessAlert.message>Your action was completed successfully.</SuccessAlert.message>
              </SuccessAlert.content>
              <SuccessAlert.close>✕</SuccessAlert.close>
            </SuccessAlert>

            <WarningAlert>
              <WarningAlert.icon>⚠️</WarningAlert.icon>
              <WarningAlert.content>
                <WarningAlert.title>Warning</WarningAlert.title>
                <WarningAlert.message>Please review your input before continuing.</WarningAlert.message>
              </WarningAlert.content>
              <WarningAlert.close>✕</WarningAlert.close>
            </WarningAlert>

            <ErrorAlert>
              <ErrorAlert.icon>❌</ErrorAlert.icon>
              <ErrorAlert.content>
                <ErrorAlert.title>Error</ErrorAlert.title>
                <ErrorAlert.message>Something went wrong. Please try again.</ErrorAlert.message>
              </ErrorAlert.content>
              <ErrorAlert.close>✕</ErrorAlert.close>
            </ErrorAlert>
          </AlertsContainer>
        </Card.body>
      </Card>

    </PageRoot>
  )
}