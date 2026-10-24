package com.matheuspires.fluxo;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import java.util.Calendar;

/**
 * Lembrete diário: dispara a notificação no horário escolhido e
 * reagenda o alarme depois que o celular é reiniciado.
 */
public class ReminderReceiver extends BroadcastReceiver {

    static final String PREFS = "fluxo";
    static final String CHANNEL = "lembretes";
    private static final String ACTION_REMIND = "com.matheuspires.fluxo.REMIND";
    private static final String[] MESSAGES = {
            "Já registrou seus gastos de hoje? Leva 2 toques 💸",
            "Bora manter a sequência? 🔥 Registre o que gastou hoje",
            "Um minutinho para as finanças: o que entrou e saiu hoje? 📊",
            "Seu eu do futuro agradece: anote os gastos de hoje 🐷",
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            SharedPreferences p = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
            schedule(context, p.getBoolean("reminderOn", false), p.getInt("reminderHour", 20));
            return;
        }
        if (ACTION_REMIND.equals(action)) notifyNow(context);
    }

    static void schedule(Context context, boolean on, int hour) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
                .putBoolean("reminderOn", on).putInt("reminderHour", hour).apply();

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pi = alarmIntent(context);
        if (am == null) return;
        am.cancel(pi);
        if (!on) return;

        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, hour);
        c.set(Calendar.MINUTE, 0);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis()) c.add(Calendar.DAY_OF_YEAR, 1);
        am.setInexactRepeating(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), AlarmManager.INTERVAL_DAY, pi);
    }

    private static PendingIntent alarmIntent(Context context) {
        Intent i = new Intent(context, ReminderReceiver.class).setAction(ACTION_REMIND);
        return PendingIntent.getBroadcast(context, 1, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = context.getSystemService(NotificationManager.class);
        if (nm == null || nm.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL, "Lembretes", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Lembrete diário para registrar seus gastos");
        nm.createNotificationChannel(ch);
    }

    private static void notifyNow(Context context) {
        ensureChannel(context);
        NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null) return;
        if (Build.VERSION.SDK_INT >= 24 && !nm.areNotificationsEnabled()) return;

        Intent open = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent content = PendingIntent.getActivity(context, 2, open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String text = MESSAGES[Calendar.getInstance().get(Calendar.DAY_OF_YEAR) % MESSAGES.length];

        Notification n = new Notification.Builder(context, CHANNEL)
                .setSmallIcon(R.drawable.ic_notification)
                .setColor(0xFF8B5CF6)
                .setContentTitle("Fluxo")
                .setContentText(text)
                .setStyle(new Notification.BigTextStyle().bigText(text))
                .setContentIntent(content)
                .setAutoCancel(true)
                .build();
        nm.notify(10, n);
    }
}
