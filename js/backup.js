/* Export and restore only the currently signed-in user's planner records. Passwords and account records are excluded. */
(() => {
  "use strict";
  const DR = (window.DR = window.DR || {});
  const $ = (id) => document.getElementById(id);
  const ALLOWED =
    /^(assignments|focusSessions|plantProgress|plantHealth|attendance|sgpaSubjects|sgpaSubjects_S[1-6]|theme|semester|timerDurations|timetable|subjectAttendance|notes|focusDailyGoal|focusSoundEnabled|notificationsEnabled|notificationLedger)$/;
  function currentUserKeys() {
    const prefix = DR.userScopePrefix;
    return Object.keys(localStorage).filter(
      (key) =>
        prefix &&
        key.startsWith(prefix) &&
        ALLOWED.test(key.slice(prefix.length)),
    );
  }
  function exportBackup() {
    const data = {};
    currentUserKeys().forEach((key) => {
      const shortKey = key.slice(DR.userScopePrefix.length);
      try {
        data[shortKey] = JSON.parse(localStorage.getItem(key));
      } catch (_) {
        /* Skip unreadable storage entries rather than exporting damaged JSON. */
      }
    });
    const backup = {
      format: "campusbloom-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      account: { name: DRAuthName(), email: DRAuthEmail() },
      data,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `campusbloom-backup-${DR.todayISO()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    // Give the browser time to start the download before releasing the URL.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    DR.toast("Your CampusBloom data backup was downloaded.");
  }
  function DRAuthName() {
    return window.DRAuth?.currentUser?.name || "Student";
  }
  function DRAuthEmail() {
    return window.DRAuth?.currentUser?.email || "";
  }
  async function importBackup(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      DR.toast("Backup file is larger than 5 MB.", "error");
      return;
    }
    let parsed;
    try {
      parsed = JSON.parse(await file.text());
    } catch (_) {
      DR.toast("This file is not valid JSON.", "error");
      return;
    }
    if (
      !parsed ||
      parsed.format !== "campusbloom-backup" ||
      parsed.version !== 1 ||
      !parsed.data ||
      typeof parsed.data !== "object" ||
      Array.isArray(parsed.data)
    ) {
      DR.toast("This is not a supported CampusBloom backup.", "error");
      return;
    }
    const entries = Object.entries(parsed.data).filter(([key]) =>
      ALLOWED.test(key),
    );
    if (!entries.length) {
      DR.toast("No compatible planner data was found in this backup.", "error");
      return;
    }
    const account = parsed.account?.email
      ? ` exported from ${parsed.account.email}`
      : "";
    if (
      !window.confirm(
        `Restore ${entries.length} data sections${account} into the currently signed-in account? Matching data in this account will be replaced. Login accounts and passwords will not be changed.`,
      )
    )
      return;
    const prefix = DR.userScopePrefix;
    currentUserKeys().forEach((key) => localStorage.removeItem(key));
    try {
      entries.forEach(([key, value]) =>
        localStorage.setItem(prefix + key, JSON.stringify(value)),
      );
    } catch (error) {
      console.error(error);
      DR.toast(
        "The backup could not be fully restored. Check browser storage space.",
        "error",
      );
      return;
    }
    DR.toast("Backup restored. CampusBloom will reload your saved data.");
    window.setTimeout(() => window.location.reload(), 450);
  }
  DR.initBackup = function () {
    $("exportBackupButton").addEventListener("click", exportBackup);
    $("importBackupButton").addEventListener("click", () =>
      $("backupFileInput").click(),
    );
    $("backupFileInput").addEventListener("change", (event) => {
      importBackup(event.target.files?.[0]);
      event.target.value = "";
    });
  };
})();
