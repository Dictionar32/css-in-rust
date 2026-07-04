"use client";

import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import {
    Page,
    Section,
    Title,
    Subtitle,
    Text,
    Card,
    Button,
    Grid,
    Badge,
    ToggleGroup,
    ToggleButton,
    Status,
    Alert,
    AlertTitle,
    AlertDescription,
    TabList,
    TabButton,
    TabPanel,
    LivePreview,
    CodeBlock,
} from "./styles";

/**
 * ARIA + Dynamic Theme Demo Page
 *
 * Mendemonstrasikan:
 * 1. ARIA attributes (@aria, @semantic, @state) via tw()
 * 2. Dynamic theme switching dengan useTheme()
 * 3. Accessible components yang responsive ke theme changes
 * 4. Best practices untuk accessibility + styling
 */
export default function AriaDynamicThemePage() {
    const { theme, toggleTheme, isLoaded } = useTheme();
    const [activeTab, setActiveTab] = useState<"aria" | "theme" | "combined">(
        "aria"
    );
    const [showAlert, setShowAlert] = useState(true);

    return (
        <Page>
            <Section>
                <Title>ARIA Attributes + Dynamic Theme</Title>
                <Text>
                    Demonstrasi penggunaan ARIA attributes via tw() API sambil
                    menangani dynamic theme switching di Next.js.
                </Text>
            </Section>

            {/* Theme Toggle — di header untuk easy access */}
            <Section>
                <Subtitle>Current Theme</Subtitle>
                <ToggleGroup>
                    <ToggleButton
                        active={theme === "light"}
                        onClick={() => theme !== "light" && toggleTheme()}
                        role="radio"
                        aria-checked={theme === "light"}
                        aria-label="Light theme"
                    >
                        ☀️ Light
                    </ToggleButton>
                    <ToggleButton
                        active={theme === "dark"}
                        onClick={() => theme !== "dark" && toggleTheme()}
                        role="radio"
                        aria-checked={theme === "dark"}
                        aria-label="Dark theme"
                    >
                        🌙 Dark
                    </ToggleButton>
                </ToggleGroup>
                <Text style={{ fontSize: "0.875rem", opacity: 0.7 }}>
                    Your choice persists sa localStorage
                </Text>
            </Section>

            {/* Tabs — demonstrating @aria + variants */}
            <Section>
                <TabList role="tablist" aria-label="Demo categories">
                    <TabButton
                        active={activeTab === "aria"}
                        onClick={() => setActiveTab("aria")}
                        role="tab"
                        aria-selected={activeTab === "aria"}
                        aria-controls="aria-panel"
                    >
                        ARIA Patterns
                    </TabButton>
                    <TabButton
                        active={activeTab === "theme"}
                        onClick={() => setActiveTab("theme")}
                        role="tab"
                        aria-selected={activeTab === "theme"}
                        aria-controls="theme-panel"
                    >
                        Theme Integration
                    </TabButton>
                    <TabButton
                        active={activeTab === "combined"}
                        onClick={() => setActiveTab("combined")}
                        role="tab"
                        aria-selected={activeTab === "combined"}
                        aria-controls="combined-panel"
                    >
                        Combined Example
                    </TabButton>
                </TabList>

                {/* ARIA Patterns Tab */}
                {activeTab === "aria" && (
                    <TabPanel id="aria-panel" role="tabpanel" aria-labelledby="aria-tab">
                        <Subtitle>ARIA Attributes with tw()</Subtitle>

                        {/* Alert Component — @semantic + @aria */}
                        {showAlert && (
                            <Alert
                                role="alert"
                                aria-live="polite"
                                aria-atomic="true"
                                aria-label="Information alert"
                            >
                                <AlertTitle>ℹ️ Information</AlertTitle>
                                <AlertDescription>
                                    Ini alert dengan proper ARIA attributes untuk screen readers
                                    dan live regions.
                                </AlertDescription>
                                <Button
                                    variant="primary"
                                    onClick={() => setShowAlert(false)}
                                    aria-label="Dismiss alert"
                                >
                                    ✕ Dismiss
                                </Button>
                            </Alert>
                        )}

                        {/* Buttons — @semantic + variants */}
                        <Card>
                            <Subtitle>Button States with ARIA</Subtitle>
                            <Grid>
                                <Button
                                    variant="primary"
                                    role="button"
                                    tabIndex={0}
                                    aria-label="Primary action button"
                                >
                                    Primary Button
                                </Button>
                                <Button
                                    variant="primary"
                                    disabled
                                    aria-label="Disabled button"
                                    aria-disabled="true"
                                >
                                    Disabled Button
                                </Button>
                                <Button
                                    variant="primary"
                                    role="button"
                                    aria-pressed="false"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                        const btn = e.currentTarget;
                                        btn.setAttribute(
                                            "aria-pressed",
                                            btn.getAttribute("aria-pressed") === "true"
                                                ? "false"
                                                : "true"
                                        );
                                    }}
                                >
                                    Toggle Button
                                </Button>
                            </Grid>
                        </Card>

                        {/* Status Indicators — variants */}
                        <Card>
                            <Subtitle>Status with Dynamic Styling</Subtitle>
                            <Grid>
                                <Status
                                    status="success"
                                    role="status"
                                    aria-label="Success status"
                                >
                                    ✓ Success
                                </Status>
                                <Status
                                    status="warning"
                                    role="status"
                                    aria-label="Warning status"
                                >
                                    ⚠ Warning
                                </Status>
                                <Status
                                    status="error"
                                    role="status"
                                    aria-label="Error status"
                                >
                                    ✕ Error
                                </Status>
                                <Status
                                    status="info"
                                    role="status"
                                    aria-label="Information status"
                                >
                                    ℹ Info
                                </Status>
                            </Grid>
                        </Card>
                    </TabPanel>
                )}

                {/* Theme Integration Tab */}
                {activeTab === "theme" && (
                    <TabPanel
                        id="theme-panel"
                        role="tabpanel"
                        aria-labelledby="theme-tab"
                    >
                        <Subtitle>Dynamic Theme with tw()</Subtitle>

                        <Card>
                            <Subtitle>Color Variants by Theme</Subtitle>
                            <Text>
                                Karena tw() generates CSS di build time, theme switching
                                dilakukan via CSS variables dan data-theme attribute.
                            </Text>

                            <Grid>
                                <Badge variant="primary">Primary</Badge>
                                <Badge variant="secondary">Secondary</Badge>
                                <Badge variant="success">Success</Badge>
                                <Badge variant="danger">Danger</Badge>
                            </Grid>
                        </Card>

                        <Card>
                            <Subtitle>How It Works</Subtitle>
                            <CodeBlock>
                                {`// globals.css
:root {
  --color-bg: #fff;
  --color-fg: #000;
}

[data-theme="dark"] {
  --color-bg: #000;
  --color-fg: #fff;
}

// tw() component
const Card = tw.div({
  base: "bg-[var(--color-bg)] text-[var(--color-fg)]"
})

// Component usage
<Card>Content adapts to theme</Card>`}
                            </CodeBlock>
                        </Card>
                    </TabPanel>
                )}

                {/* Combined Example Tab */}
                {activeTab === "combined" && (
                    <TabPanel
                        id="combined-panel"
                        role="tabpanel"
                        aria-labelledby="combined-tab"
                    >
                        <Subtitle>ARIA + Theme Together</Subtitle>

                        <Card>
                            <Subtitle>Accessible, Theme-Aware Components</Subtitle>

                            <Grid>
                                {/* Dialog-like card with ARIA */}
                                <div
                                    role="dialog"
                                    aria-labelledby="dialog-title"
                                    aria-describedby="dialog-desc"
                                    style={{
                                        border: "2px solid currentColor",
                                        padding: "1rem",
                                        borderRadius: "0.5rem",
                                    }}
                                >
                                    <h3 id="dialog-title">Accessible Dialog</h3>
                                    <p id="dialog-desc">
                                        Ni component ay may semantic roles + theme-aware styling
                                    </p>
                                    <Button variant="primary">Close Dialog</Button>
                                </div>

                                {/* Fieldset with legend */}
                                <fieldset>
                                    <legend>Accessible Form Group</legend>
                                    <label>
                                        <input
                                            type="checkbox"
                                            aria-label="Option 1"
                                            defaultChecked
                                        />{" "}
                                        Option 1
                                    </label>
                                    <label>
                                        <input type="checkbox" aria-label="Option 2" /> Option 2
                                    </label>
                                </fieldset>
                            </Grid>
                        </Card>

                        <Card>
                            <Subtitle>Live Coding Tips</Subtitle>
                            <ul style={{ paddingLeft: "1.5rem" }}>
                                <li>
                                    <code>@aria</code> sa component config ay for static ARIA
                                    attributes
                                </li>
                                <li>
                                    <code>@state</code> mapping binds props to aria-* attributes
                                </li>
                                <li>
                                    Dynamic theme = CSS variables + data-theme attribute
                                </li>
                                <li>
                                    Combine para sa fully accessible, theme-aware components
                                </li>
                                <li>
                                    Test with screen readers (VoiceOver, NVDA, JAWS)
                                </li>
                            </ul>
                        </Card>
                    </TabPanel>
                )}
            </Section>

            {/* Live Preview */}
            <Section>
                <Subtitle>Live Preview</Subtitle>
                <LivePreview>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <strong>Current Theme:</strong> {theme?.toUpperCase() || "LOADING"}
                        </div>
                        <Card>
                            <Subtitle>Theme-Aware Content</Subtitle>
                            <Text>
                                Try toggling the theme at the top. Lahat ng components sa page
                                ay automatic na mag-a-adapt sa CSS variables.
                            </Text>
                        </Card>
                        <div
                            role="status"
                            aria-live="polite"
                            aria-label="Theme change notification"
                        >
                            Last theme change: {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                </LivePreview>
            </Section>

            {/* Key Takeaways */}
            <Section>
                <Subtitle>Key Takeaways</Subtitle>
                <Grid>
                    <Card>
                        <strong>ARIA + tw()</strong>
                        <Text>
                            Declare ARIA attributes sa tw() config, hindi sa individual
                            elements
                        </Text>
                    </Card>
                    <Card>
                        <strong>Dynamic Theme</strong>
                        <Text>
                            Use CSS variables + data-theme attribute para sa runtime theme
                            switching
                        </Text>
                    </Card>
                    <Card>
                        <strong>Accessibility First</strong>
                        <Text>
                            Combine semantic HTML, ARIA roles, at proper styling para sa best
                            UX
                        </Text>
                    </Card>
                    <Card>
                        <strong>Persistence</strong>
                        <Text>
                            Store theme preference sa localStorage, apply sa mount para sa
                            seamless experience
                        </Text>
                    </Card>
                </Grid>
            </Section>
        </Page>
    );
}
