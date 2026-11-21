<script lang="ts" setup>
useHead({
  titleTemplate: 'Settings - %s',
})
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <LayoutHeader
        title="Settings"
      />
    </template>

    <template #body>
      <LayoutContent size="lg">
        <LayoutHeading
          title="Settings"
          description="Manage your account, company, and system preferences"
        />

        <section class="space-y-4">
          <LayoutHeading
            title="Account & Security"
          />
          <NuxtLink :to="toRoute('/settings/account-profile')">
            <BaseCard class="flex items-center justify-between gap-4">
              <section class="flex items-center gap-4 flex-1">
                <UBadge
                  icon="lucide:user"
                  size="xl"
                  variant="soft"
                />
                <div class="flex flex-col">
                  <BaseTypography
                    as="h1"
                    text="Account Profile"
                  />
                  <BaseTypography
                    as="p"
                    type="text"
                    text="Manage your account profile and security"
                  />
                </div>
              </section>
              <UIcon
                name="lucide:chevron-right"
                size="24"
              />
            </BaseCard>
          </NuxtLink>
        </section>

        <ShowIf
          subject="company-infomation"
          action="read"
        >
          <section class="space-y-4">
            <LayoutHeading
              title="Organization"
            />
            <NuxtLink :to="toRoute('/settings/company-information')">
              <BaseCard class="flex items-center justify-between gap-4">
                <section class="flex items-center gap-4 flex-1">
                  <UBadge
                    icon="lucide:building-2"
                    size="xl"
                    variant="soft"
                  />
                  <div class="flex flex-col">
                    <BaseTypography
                      as="h1"
                      text="Company Information"
                    />
                    <BaseTypography
                      as="p"
                      type="text"
                      text="Update company details, and business information"
                    />
                  </div>
                </section>
                <UIcon
                  name="lucide:chevron-right"
                  size="24"
                />
              </BaseCard>
            </NuxtLink>
          </section>
        </ShowIf>

        <section class="space-y-4">
          <LayoutHeading
            title="Support & System"
          />
          <BaseCard class="flex items-center justify-between flex-wrap gap-4">
            <section class="flex items-center gap-4">
              <UBadge
                icon="lucide:globe"
                size="xl"
                variant="soft"
              />
              <div class="flex flex-col">
                <BaseTypography
                  as="h1"
                  text="Language"
                />
                <BaseTypography
                  as="p"
                  type="text"
                  text="Choose your preferred language, timezone."
                />
              </div>
            </section>
            <div class="max-w-40 w-full">
              <SelectLanguage />
            </div>
          </BaseCard>

          <BaseCard class="flex items-center justify-between flex-wrap gap-4">
            <section class="flex items-center gap-4">
              <UBadge
                icon="lucide:sun"
                size="xl"
                variant="soft"
              />
              <div class="flex flex-col">
                <BaseTypography
                  as="h1"
                  text="Theme Mode"
                />
                <BaseTypography
                  as="p"
                  type="text"
                  text="Choose your preferred appearance"
                />
              </div>
            </section>
            <UColorModeSwitch size="xl" />
          </BaseCard>
        </section>
      </LayoutContent>
    </template>
  </UDashboardPanel>
</template>
