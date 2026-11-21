<script setup lang="ts">
useHead({
  titleTemplate: 'Facebook Data Deletion Instructions - %s',
})
</script>

<template>
  <div>
    <div class="text-center mb-10">
      <img
        src="/img/syncra-logo.png"
        alt="Syncra"
        class="mx-auto h-16 mb-4"
      >
      <h1 class="text-3xl font-semibold">
        Facebook Data Deletion Instructions
      </h1>
      <p class="text-muted mt-2">
        Instructions for requesting deletion of your Facebook data from Syncra
      </p>
      <p class="text-sm text-muted mt-3">
        Last Update: December 18, 2025
      </p>
    </div>

    <div
      class="bg-elevated/50 border-default transition-all rounded-lg border p-8 space-y-8"
    >
      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          Overview
        </h2>
        <p class="text-muted">
          If you have used Facebook Login to access Syncra, you can request deletion of your Facebook data associated with your Syncra account. This page provides instructions on how to request data deletion.
        </p>
      </section>

      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          How to Request Data Deletion
        </h2>
        <p class="text-muted">
          To request deletion of your Facebook data from Syncra, please follow these steps:
        </p>
        <ol class="list-decimal space-y-3 pl-6 text-muted">
          <li>
            <p class="text-muted">
              Send an email to <a
                href="mailto:privacy@syncra.app"
                class="text-teal-600 underline"
              >privacy@syncra.app</a> with the subject line "Facebook Data Deletion Request"
            </p>
          </li>
          <li>
            <p class="text-muted">
              Include the following information in your email:
            </p>
            <ul class="list-disc space-y-2 pl-6 mt-2 text-muted">
              <li>Your full name</li>
              <li>The email address associated with your Syncra account</li>
              <li>Your Facebook User ID (if available)</li>
              <li>A clear statement that you want to delete your Facebook data from Syncra</li>
            </ul>
          </li>
          <li>
            <p class="text-muted">
              We will verify your identity and process your request within 30 days of receipt.
            </p>
          </li>
          <li>
            <p class="text-muted">
              Once your request is processed, we will send you a confirmation email.
            </p>
          </li>
        </ol>
      </section>

      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          What Data Will Be Deleted
        </h2>
        <p class="text-muted">
          When you request deletion of your Facebook data, we will remove:
        </p>
        <ul class="list-disc space-y-2 pl-6 text-muted">
          <li>Your Facebook User ID associated with your Syncra account</li>
          <li>Any profile information obtained from Facebook during the login process</li>
          <li>Authentication tokens and credentials related to Facebook Login</li>
        </ul>
        <p class="text-muted mt-4">
          <span class="text-highlighted">Note: </span>
          If you have created content or data within Syncra using your account, that content will remain unless you specifically request account deletion. To delete your entire Syncra account and all associated data, please contact us separately.
        </p>
      </section>

      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          Alternative Method: Facebook Settings
        </h2>
        <p class="text-muted">
          You can also request data deletion directly through Facebook:
        </p>
        <ol class="list-decimal space-y-3 pl-6 text-muted">
          <li>
            <p class="text-muted">
              Go to your Facebook account settings
            </p>
          </li>
          <li>
            <p class="text-muted">
              Navigate to "Apps and Websites" section
            </p>
          </li>
          <li>
            <p class="text-muted">
              Find "Syncra" in your list of connected apps
            </p>
          </li>
          <li>
            <p class="text-muted">
              Click "Remove" to disconnect Syncra from your Facebook account
            </p>
          </li>
          <li>
            <p class="text-muted">
              If you want to delete your data from Syncra's servers, you must still send us an email as described above
            </p>
          </li>
        </ol>
      </section>

      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          Processing Time
        </h2>
        <p class="text-muted">
          We will process your data deletion request within 30 days of receiving a valid request. You will receive a confirmation email once the deletion is complete.
        </p>
      </section>

      <section class="space-y-5">
        <h2 class="font-semibold text-lg mb-2">
          Important Notes
        </h2>
        <div class="space-y-2 leading-relaxed">
          <p class="text-muted">
            <span class="text-highlighted">Account Access: </span>
            After deleting your Facebook data, you may need to set up an alternative login method (email/password) if you wish to continue using Syncra.
          </p>
          <p class="text-muted">
            <span class="text-highlighted">Legal Requirements: </span>
            We may retain certain information as required by law or for legitimate business purposes, such as transaction records or data necessary to resolve disputes.
          </p>
          <p class="text-muted">
            <span class="text-highlighted">Backup Systems: </span>
            Deleted data may persist in backup systems for up to 90 days before being permanently removed.
          </p>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="font-semibold text-lg mb-2">
          Contact Information
        </h2>
        <p class="text-muted">
          If you have any questions about this process or need assistance with your data deletion request, please contact us:
        </p>
        <p class="text-muted">
          Email: <a
            href="mailto:privacy@syncra.app"
            class="text-teal-600 underline"
          >privacy@syncra.app</a><br>
          Address: Syncra Inc.
        </p>
        <p class="text-muted">
          We will respond to all legitimate requests within 30 days.
        </p>
      </section>
    </div>
  </div>
</template>
