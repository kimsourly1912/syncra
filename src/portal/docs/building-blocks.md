# Portal building blocks

These are the shared components, composables, stores, and utilities in Portal. Components, composables, utils, and stores are auto-imported ([architecture](architecture.md#what-gets-imported-automatically)). Use them before writing new ones. Read the source for the full props. This page tells you which one to use.

When you add a shared building block, or change one's behavior, update this page in the same change. Add something here only when a second feature or the app shell needs it. Until then, keep it inside the feature.

## Layout

| Component | Use for |
| --- | --- |
| `LayoutHeader` | The `UDashboardPanel #header`. With `to`, it shows a back button labeled `title`. Without `to`, it shows a plain title. |
| `LayoutContent` | The page body container. `size`: `sm`, `md`, `lg`, `xl` (default), or `default`. Controls max width and vertical spacing. |
| `LayoutHeading` | A page or section `title` and `description` (`BaseTypography` heading-1 + text) |
| `LayoutWrapper` | A section with a heading row. `#prefix` replaces the heading; `#suffix` holds section actions. |
| `LayoutNavigator`, `UserMenu` | Parts of the shell. Only `layouts/default.vue` uses them. |
| `BaseCard` | A soft card (`bg-elevated/50 ring-default p-4`) for form sections |
| `BaseTypography` | Text with `type`: `heading-1`, `heading-2`, `heading-3` (default), or `text`. Set the element with `as`. |

## Feedback and dialogs

| Component | Use for |
| --- | --- |
| `ModalConfirmation` | Confirming an action. `v-model` opens it. Props: `title`, `description`, `icon`, `color`, `labelLeft`, `labelRight`, and `loading`. It emits `left` (cancel, which closes the modal) and `right` (confirm, which doesn't close it, so close it after success). |
| `ModalSuccess` | A success dialog with `title` and `description` (`v-model`) |
| `ModalOverlay` | A full-screen loading overlay with a `title` |
| `ModalContent`, `ModalHeading` | The body and heading inside a custom `UModal`. `ModalContent` has `size` `sm`, `md`, or `lg`. |
| `EmptyData` | An empty state. Takes `UEmpty` props; defaults to "No data found". Pass a specific title and description. |
| `BannerAlert` | An inline colored banner: `primary`, `error`, `info`, or `neutral` |
| `useAppToast()` | `{ toast }` with `add(type, opts)`, `addException(e)`, `addServerError()`, `remove`, and `clear` ([data access → errors](data-access.md#errors)) |

## Inputs

| Component | Use for |
| --- | --- |
| `InputPassword` | A password field with a show/hide toggle (`v-model`, `v-model:show`). Takes `UInput` props. |
| `PasswordSuggestionMessage` | A live password strength checklist, from `app/utils/validate.ts` |
| `InputPhoneNumber` | A country code plus a number (`v-model:phone`, `v-model:phone-code`, `options`) |
| `DateRangePicker` | A start and end date with presets (`v-model` `{ start, end }`) |
| `VerifyCode`, `VerifyCodeMessage` | Entering a one-time code (auth) |
| `SelectLanguage` | The `en`/`zh` switcher |
| `UploadFileItem` | Rows for staged files, with optional success and delete markers |

## Data display

| Component | Use for |
| --- | --- |
| `SatisticCard` | A row of stat cards (`items: { label, icon, count, color }[]`) with a skeleton while `pending`. The misspelled name is kept on purpose. |
| `Avatar`, `LogoBadge` | A user avatar, and a company or app logo in a ring |
| `TokenBalanceBadge` | The token balance in the header, with a popover. Known boundary debt: it imports from `features/token`. |
| `ActivityLog`, `ActivityTimeline` | The company audit list and timeline (`entries: ActivityLogDTO.ActivityLogEntry[]`) |
| `ExcelPreview` | A read-only Handsontable workbook preview (`data`, `theme`) |
| `ShowIf` | Renders its slot only when `can(role, subject, action)` from `usePermission` allows it. Navigation only, not security. |

## Composables

| Composable | Use for |
| --- | --- |
| `useAPI`, `useRawAPI`, `useFileAPI` | API calls ([data access](data-access.md#the-client-stack)) |
| `usePermission()` | `can(role, subject, action)`, `getRoutes(role)`, `getActions`. This is the client-side role map for `ADMIN` and `OPERATOR`. |
| `useFeatureFlags()` | `hideSocialLogin` and `hidePhoneSignUp`, from runtime config |
| `useBalancePolling(intervalMs = 60_000)` | Refreshes the token balance while mounted |
| `useRequestToken()` | The token-request (contact sales) modal state and submit |
| `useContactSale()` | The product contact-sales form state and submit |
| `useAppState()` | Small global state for the auth flow (`password`, `fromEdit`, `reset`) |
| `useAuth`, `useSignIn`, `useSignUp`, `useOTP`, `useOAuth`, `useForgotPassword`, `useOnboarding` | Auth and onboarding flows. Only their own pages use them. |

## Stores (Pinia)

| Store | Holds |
| --- | --- |
| `useProfileStore()` | Profile, `companyId`, `userRole`, `isAdmin`, `isMember`, `onboarded`, `partialOnboarded`, `canExportToErp`, `tokenBalance`, `authStatus`. Actions: `execute()`, `refreshBalance()`, `onLogout()`, `clear()`. |
| `useApplicationStore()` | Shell state: sidebar collapsed, header `to` and `title` |

## Utilities

| Utility | File | Use for |
| --- | --- | --- |
| `buildEndPoint<Parts>(prefix, parts)` | `utils/api.ts` | Service endpoint paths |
| `toRoute(path, suffix?)` | `utils/common.ts` | Typed internal links from `constants/route.ts` |
| `tw` | `utils/common.ts` | Marks class strings inside TypeScript |
| `dateTimeFormatter`, `dateFormatter`, `formatDate` | `utils/common.ts` | Dates for display (`Dec 24, 2025, 01:52 PM`) |
| `humanFileSize`, `parseFileSize`, `getFileInfo` | `utils/common.ts` | File sizes and file metadata |
| `downloadBlob(blob, filename)` | `utils/common.ts` | Saving a download |
| `formatPid(displayId)` | `utils/common.ts` | The Processing ID for display |
| `humanFormatSeconds`, `msToTimeParts`, `formatTime` | `utils/common.ts` | ETAs and durations |
| `resolveApiUrl(apiURL, path)` | `utils/common.ts` | Turning an API-relative file URL into an absolute one |
| `extractFileInfo`, `getFileName`, `getFileExtension` | `utils/file.ts` | Download response headers |
| `validatePassword`, `validatePasswordDetailed`, `getPasswordValidationMessages` | `utils/validate.ts` | Password rules |

## Constants

| Constant | File | Holds |
| --- | --- | --- |
| `ROUTE_PRIVATE`, `ROUTE_PUBLIC` | `constants/route.ts` | Every route path. Route rules are generated from these. |
| `ASYNC_DATA`, `STATE`, `STORE_ID`, `COOKIE`, `AUTH_STATUS` | `constants/key.ts` | Keys for `useAsyncData`, `useState`, stores, and cookies |
| `ACCEPTED_IMAGE_TYPES`, `MAX_IMAGE_SIZE` | `constants/app.ts` | Avatar and logo upload limits |
| Regex patterns | `constants/regx.ts` | Digits and the password pattern for `baseSchema` |
