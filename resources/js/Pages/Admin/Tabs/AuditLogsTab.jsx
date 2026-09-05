import React, { useState, useEffect, useMemo } from "react";

// Довідник типів адміністративних дій та подій аудиту
const ACTION_MAP = {
    // Заселення, виселення, переселення
    evicted: {
        label: "Виселення",
        category: "residency",
        color: "rose",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        ),
    },
    manual_eviction: {
        label: "Виселення (вручну)",
        category: "residency",
        color: "rose",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
        ),
    },
    booking_approved: {
        label: "Заселення (ордер)",
        category: "residency",
        color: "emerald",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    manual_checkin: {
        label: "Заселення (вручну)",
        category: "residency",
        color: "emerald",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    booking_rejected: {
        label: "Відхилено бронь",
        category: "residency",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    booking_requested: {
        label: "Запит на заселення",
        category: "residency",
        color: "amber",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    relocation_approved: {
        label: "Ухвалено переїзд",
        category: "residency",
        color: "indigo",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    manual_relocation: {
        label: "Переселення (вручну)",
        category: "residency",
        color: "indigo",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    relocation_requested: {
        label: "Запит на переїзд",
        category: "residency",
        color: "sky",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
        ),
    },
    relocation_rejected: {
        label: "Переїзд відхилено",
        category: "residency",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },

    // Академічні переведення
    academic_promotion: {
        label: "Переведення на курс (+1)",
        category: "academic",
        color: "emerald",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
    },
    academic_demotion: {
        label: "Пониження курсу (-1)",
        category: "academic",
        color: "amber",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
        ),
    },
    manual_promotion: {
        label: "Перехід на навч. рік",
        category: "academic",
        color: "purple",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    academic_year_transition: {
        label: "Перехід на навч. рік",
        category: "academic",
        color: "purple",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },

    // Користувачі та профілі
    user_profile_updated_by_admin: {
        label: "Оновлення профілю",
        category: "profiles",
        color: "sky",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
        ),
    },
    profile_update: {
        label: "Зміна профілю",
        category: "profiles",
        color: "sky",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
    },
    profile_email_update: {
        label: "Зміна Email студента",
        category: "profiles",
        color: "blue",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    email_change_request_submitted: {
        label: "Запит на зміну Email",
        category: "profiles",
        color: "sky",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
        ),
    },
    email_change_approved: {
        label: "Схвалено зміну Email",
        category: "profiles",
        color: "emerald",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    email_change_rejected: {
        label: "Відхилено зміну Email",
        category: "profiles",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    email_change_rejected_auto: {
        label: "Email зайнято",
        category: "profiles",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
        ),
    },
    impersonated_user: {
        label: "Вхід під акаунтом",
        category: "profiles",
        color: "indigo",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
        ),
    },
    commandant_created: {
        label: "Створено коменданта",
        category: "profiles",
        color: "violet",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
        ),
    },
    commandant_generated: {
        label: "Згенеровано коменданта",
        category: "profiles",
        color: "violet",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },
    commandant_deleted: {
        label: "Видалено коменданта",
        category: "profiles",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
        ),
    },
    user_generated: {
        label: "Згенеровано студента",
        category: "profiles",
        color: "teal",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        ),
    },

    // Кімнати, корпуси, поверхи
    room_created: {
        label: "Створено кімнату",
        category: "rooms",
        color: "teal",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    rooms_bulk_created: {
        label: "Масове створення кімнат",
        category: "rooms",
        color: "teal",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
    },
    room_deleted: {
        label: "Видалено кімнату",
        category: "rooms",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    room_status_toggled: {
        label: "Статус ремонту",
        category: "rooms",
        color: "cyan",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            </svg>
        ),
    },
    room_intake_toggled: {
        label: "Набір у кімнату",
        category: "rooms",
        color: "cyan",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    },
    room_visibility_toggled: {
        label: "Видимість на сайті",
        category: "rooms",
        color: "cyan",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
        ),
    },
    room_accessibility_toggled: {
        label: "Інклюзивність кімнати",
        category: "rooms",
        color: "cyan",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
    },
    room_capacity_updated: {
        label: "Зміна місткості",
        category: "rooms",
        color: "cyan",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        ),
    },
    building_created: {
        label: "Створено корпус",
        category: "rooms",
        color: "teal",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
    },
    building_deleted: {
        label: "Видалено корпус",
        category: "rooms",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    floor_created: {
        label: "Створено поверх",
        category: "rooms",
        color: "teal",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
            </svg>
        ),
    },
    floor_deleted: {
        label: "Видалено поверх",
        category: "rooms",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },

    // Система, налаштування, довідники
    settings_updated: {
        label: "Оновлено конфігурацію",
        category: "system",
        color: "slate",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
        ),
    },
    logs_cleared: {
        label: "Очищення журналу",
        category: "system",
        color: "rose",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    specialty_created: {
        label: "Створено напрям",
        category: "system",
        color: "slate",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
        ),
    },
    specialty_deleted: {
        label: "Видалено напрям",
        category: "system",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    course_created: {
        label: "Створено курс",
        category: "system",
        color: "slate",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    course_deleted: {
        label: "Видалено курс",
        category: "system",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
    group_created: {
        label: "Створено групу",
        category: "system",
        color: "slate",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
    group_deleted: {
        label: "Видалено групу",
        category: "system",
        color: "red",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
        ),
    },
};

// Семантичні стилі для бейджів дій
const BADGE_STYLES = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
    rose: "bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
    red: "bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/40",
    amber: "bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
    violet: "bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/40",
    sky: "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
    blue: "bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
    teal: "bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/40",
    slate: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-gray-700/60 dark:text-gray-300 dark:border-gray-600",
};

// Розпізнавання та людський переклад коду події
const resolveActionInfo = (rawAction = "") => {
    const key = String(rawAction).toLowerCase();
    if (ACTION_MAP[key]) return ACTION_MAP[key];

    // Інтуїтивні правила для невідомих дій
    if (key.includes("evict") || key.includes("reject")) {
        return {
            label: key.replace(/_/g, " ").toUpperCase(),
            category: "residency",
            color: "rose",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            ),
        };
    }
    if (key.includes("approv") || key.includes("checkin")) {
        return {
            label: key.replace(/_/g, " ").toUpperCase(),
            category: "residency",
            color: "emerald",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
        };
    }
    if (key.includes("promot") || key.includes("demot") || key.includes("academic")) {
        return {
            label: key.replace(/_/g, " ").toUpperCase(),
            category: "academic",
            color: "purple",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
            ),
        };
    }
    if (key.includes("room") || key.includes("building") || key.includes("floor")) {
        return {
            label: key.replace(/_/g, " ").toUpperCase(),
            category: "rooms",
            color: "teal",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                </svg>
            ),
        };
    }

    // Загальний фолбек
    const humanized = key
        .replace(/_/g, " ")
        .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());

    return {
        label: humanized || "Системна дія",
        category: "system",
        color: "slate",
        icon: (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    };
};

// Зручне форматування дат з відносним часом
const formatAuditDate = (dateString) => {
    if (!dateString) return { relative: "—", full: "" };
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return { relative: dateString, full: dateString };

        const full = d.toLocaleString("uk-UA", {
            timeZone: "Europe/Kyiv",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });

        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMin / 60);

        const isToday = d.toDateString() === now.toDateString();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        const isYesterday = d.toDateString() === yesterday.toDateString();

        const timeStr = d.toLocaleTimeString("uk-UA", {
            timeZone: "Europe/Kyiv",
            hour: "2-digit",
            minute: "2-digit",
        });

        let relative = "";
        if (diffMin < 1) {
            relative = "Щойно";
        } else if (diffMin < 60) {
            relative = `${diffMin} хв тому`;
        } else if (isToday) {
            relative = `Сьогодні, ${timeStr}`;
        } else if (isYesterday) {
            relative = `Вчора, ${timeStr}`;
        } else {
            relative = d.toLocaleDateString("uk-UA", {
                timeZone: "Europe/Kyiv",
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }) + `, ${timeStr}`;
        }

        return { relative, full, timeStr };
    } catch {
        return { relative: dateString, full: dateString };
    }
};

// Розумне виділення номерів кімнат, курсів та ID у тексті подробиць
const renderFormattedDetails = (details = "") => {
    if (!details) return <span className="text-gray-400 italic">—</span>;

    // Регулярний вираз для пошуку ключових токенів:
    // 1) Номери кімнат (№101, № 204)
    // 2) Курсові переходи ((+1), (-1))
    // 3) ID сутностей (#5, #120)
    const regex = /(№\s*\d+|(?:\(\+1\))|(?:\(-1\))|#\d+)/g;
    const parts = details.split(regex);

    return (
        <span className="leading-relaxed">
            {parts.map((part, i) => {
                if (!part) return null;
                if (/^№\s*\d+$/.test(part)) {
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-slate-200 border border-slate-200/70 dark:border-gray-600 mx-0.5"
                        >
                            {part}
                        </span>
                    );
                }
                if (part === "(+1)") {
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mx-0.5"
                        >
                            +1 курс
                        </span>
                    );
                }
                if (part === "(-1)") {
                    return (
                        <span
                            key={i}
                            className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-black bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 mx-0.5"
                        >
                            -1 курс
                        </span>
                    );
                }
                if (/^#\d+$/.test(part)) {
                    return (
                        <span
                            key={i}
                            className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-1 py-0.5 rounded mx-0.5"
                        >
                            {part}
                        </span>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default function AuditLogsTab({
    auditLogs = [],
    handleClearLogs,
    handleExportPDF,
    handleExportCSV,
}) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(20);
    const [isClearModalOpen, setIsClearModalOpen] = useState(false);

    // KPI статистика для швидкого огляду
    const stats = useMemo(() => {
        const total = auditLogs.length;
        let residencyCount = 0;
        let academicCount = 0;
        let roomConfigCount = 0;
        let profileCount = 0;

        const now = new Date();
        const todayStr = now.toDateString();
        let todayCount = 0;

        auditLogs.forEach((log) => {
            const info = resolveActionInfo(log.action);
            if (info.category === "residency") residencyCount++;
            else if (info.category === "academic") academicCount++;
            else if (info.category === "rooms") roomConfigCount++;
            else if (info.category === "profiles") profileCount++;

            if (log.created_at) {
                const d = new Date(log.created_at);
                if (d.toDateString() === todayStr) todayCount++;
            }
        });

        return {
            total,
            residencyCount,
            academicCount,
            roomConfigCount,
            profileCount,
            todayCount,
        };
    }, [auditLogs]);

    // Категорії фільтрації з лічильниками
    const categories = [
        { id: "all", label: "Усі події", count: stats.total },
        { id: "residency", label: "Заселення та виселення", count: stats.residencyCount },
        { id: "academic", label: "Академічні переведення", count: stats.academicCount },
        { id: "rooms", label: "Кімнати та корпуси", count: stats.roomConfigCount },
        { id: "profiles", label: "Профілі та користувачі", count: stats.profileCount },
    ];

    // Фільтрація логів
    const filteredLogs = useMemo(() => {
        return auditLogs.filter((log) => {
            const info = resolveActionInfo(log.action);

            // Фільтр за категорією
            if (selectedCategory !== "all" && info.category !== selectedCategory) {
                return false;
            }

            // Пошук за текстом
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const userName = log.user?.name?.toLowerCase() || "";
                const userEmail = log.user?.email?.toLowerCase() || "";
                const actionCode = (log.action || "").toLowerCase();
                const actionLabel = info.label.toLowerCase();
                const details = (log.details || "").toLowerCase();

                return (
                    userName.includes(q) ||
                    userEmail.includes(q) ||
                    actionCode.includes(q) ||
                    actionLabel.includes(q) ||
                    details.includes(q)
                );
            }

            return true;
        });
    }, [auditLogs, selectedCategory, searchQuery]);

    // Скидання сторінки при зміні фільтрів
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedCategory]);

    // Пагінація
    const totalPages = Math.max(1, Math.ceil(filteredLogs.length / perPage));
    const paginatedLogs = filteredLogs.slice(
        (currentPage - 1) * perPage,
        currentPage * perPage
    );

    // Вбудований клієнтський експорт у CSV (з UTF-8 BOM для ідеальної кирилиці в Excel)
    const handleDownloadCSV = () => {
        if (handleExportCSV) {
            handleExportCSV();
            return;
        }

        if (!filteredLogs.length) return;

        const headers = [
            "ID",
            "Дата і час",
            "Користувач / Адмін",
            "Email",
            "Код дії",
            "Тип події",
            "Подробиці",
        ];

        const rows = filteredLogs.map((log) => {
            const info = resolveActionInfo(log.action);
            const dateFormatted = new Date(log.created_at).toLocaleString("uk-UA", {
                timeZone: "Europe/Kyiv",
            });
            const userName = log.user?.name || "Система / Автоматично";
            const userEmail = log.user?.email || "—";
            const actionCode = log.action || "";
            const actionLabel = info.label;
            const details = (log.details || "").replace(/"/g, '""');

            return [
                log.id,
                `"${dateFormatted}"`,
                `"${userName}"`,
                `"${userEmail}"`,
                `"${actionCode}"`,
                `"${actionLabel}"`,
                `"${details}"`,
            ];
        });

        const csvContent =
            "\uFEFF" +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const dateStr = new Date().toISOString().split("T")[0];
        link.setAttribute("href", url);
        link.setAttribute("download", `audit_logs_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Друк або PDF
    const handlePrintPDF = () => {
        if (handleExportPDF) {
            handleExportPDF();
            return;
        }
        window.print();
    };

    // Отримання ініціалів користувача
    const getInitials = (name = "") => {
        if (!name) return "СИ";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
        return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
    };

    return (
        <div className="space-y-5 animate-fade-in">
            {/* 1. ВЕРХНІ КАРТКИ СТАТИСТИКИ (KPI) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Всього подій */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5 min-w-0 transition-transform hover:-translate-y-0.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                            {stats.total}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Всього записів аудиту
                        </div>
                    </div>
                </div>

                {/* Заселення та виселення */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5 min-w-0 transition-transform hover:-translate-y-0.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                            {stats.residencyCount}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Заселень / Виселень
                        </div>
                    </div>
                </div>

                {/* Академічні переведення */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5 min-w-0 transition-transform hover:-translate-y-0.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                            {stats.academicCount}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Академічних дій
                        </div>
                    </div>
                </div>

                {/* Подій за сьогодні */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 shadow-sm flex items-center gap-3.5 min-w-0 transition-transform hover:-translate-y-0.5">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-800/40">
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="min-w-0">
                        <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
                            {stats.todayCount}
                        </div>
                        <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                            Активності за сьогодні
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ГОЛОВНИЙ БЛОК ЖУРНАЛУ ТА ФІЛЬТРІВ */}
            <div className="bg-white dark:bg-gray-800 border border-slate-100 dark:border-gray-700 rounded-3xl shadow-sm overflow-hidden">
                {/* Панель керування: Заголовок + Пошук + Дії */}
                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-gray-700 space-y-4">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                                <h3 className="font-extrabold text-gray-900 dark:text-white text-lg sm:text-xl tracking-tight">
                                    Журнал аудиту дій
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-gray-300 text-xs font-bold">
                                    {filteredLogs.length} {filteredLogs.length === 1 ? "запис" : filteredLogs.length < 5 ? "записи" : "записів"}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Безпековий лог дій адміністрації, змін статусів поселення та переведення студентів
                            </p>
                        </div>

                        {/* Кнопки експорту та очищення */}
                        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
                            <button
                                type="button"
                                onClick={handleDownloadCSV}
                                disabled={filteredLogs.length === 0}
                                className="px-3.5 py-2 bg-slate-50 dark:bg-gray-700/60 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-gray-600 transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                                title="Завантажити таблицю у форматі CSV"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Експорт CSV</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePrintPDF}
                                className="px-3.5 py-2 bg-slate-50 dark:bg-gray-700/60 hover:bg-slate-100 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-gray-600 transition-all shadow-xs flex items-center gap-1.5"
                                title="Роздрукувати журнал дій"
                            >
                                <svg className="w-3.5 h-3.5 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                <span>Друк / PDF</span>
                            </button>

                            {auditLogs.length > 0 && handleClearLogs && (
                                <button
                                    type="button"
                                    onClick={() => setIsClearModalOpen(true)}
                                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-200/80 dark:border-rose-900/50 flex items-center gap-1.5 active:scale-95"
                                    title="Очистити записи журналу"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    <span>Очистити</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Рядок пошуку та категорійних табів */}
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1">
                        {/* Поле розумного пошуку */}
                        <div className="relative flex-1 max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Пошук за дією, студентом, email чи кімнатою..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full text-xs rounded-xl border border-slate-200 dark:border-gray-600 pl-10 pr-9 py-2 bg-slate-50 dark:bg-gray-700/60 text-gray-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Кількість на сторінку */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto text-xs text-slate-500 dark:text-gray-400">
                            <span className="text-[11px] font-medium">Показувати:</span>
                            <select
                                value={perPage}
                                onChange={(e) => {
                                    setPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="text-xs rounded-xl border-slate-200 dark:border-gray-600 bg-slate-50 dark:bg-gray-700 py-1.5 px-2.5 text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-semibold"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>

                    {/* Категорійні чіпи / фільтри */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
                        {categories.map((cat) => {
                            const isActive = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                        isActive
                                            ? "bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs"
                                            : "bg-slate-100 dark:bg-gray-700/60 hover:bg-slate-200 dark:hover:bg-gray-700 text-slate-600 dark:text-gray-300"
                                    }`}
                                >
                                    <span>{cat.label}</span>
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isActive
                                                ? "bg-white/20 text-white"
                                                : "bg-slate-200/80 dark:bg-gray-600 text-slate-600 dark:text-gray-300"
                                        }`}
                                    >
                                        {cat.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 3. ТАБЛИЦЯ ЗАПИСІВ АУДИТУ */}
                {paginatedLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-700 text-slate-400 dark:text-gray-400 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {auditLogs.length === 0 ? "Журнал аудиту порожній" : "Записів не знайдено"}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                            {auditLogs.length === 0
                                ? "Адміністративні події автоматично з'являтимуться тут при змінах у системі."
                                : "Спробуйте змінити пошуковий запит або обрати іншу категорію фільтра."}
                        </p>
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="mt-4 px-3.5 py-1.5 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                            >
                                Очистити пошук
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-gray-700 bg-slate-50/75 dark:bg-gray-700/40 text-[10.5px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                                    <th className="py-3.5 px-5">Дійова особа / Користувач</th>
                                    <th className="py-3.5 px-5">Дія</th>
                                    <th className="py-3.5 px-5 min-w-[280px]">Подробиці події</th>
                                    <th className="py-3.5 px-5 text-right whitespace-nowrap">Дата та час</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-gray-700/70 text-gray-700 dark:text-gray-200">
                                {paginatedLogs.map((log) => {
                                    const actionInfo = resolveActionInfo(log.action);
                                    const dateInfo = formatAuditDate(log.created_at);
                                    const badgeClass =
                                        BADGE_STYLES[actionInfo.color] || BADGE_STYLES.slate;
                                    const isUserActor = Boolean(log.user);

                                    // Роль користувача
                                    const roleBadge = (() => {
                                        if (!log.user) return { label: "Система", color: "bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300" };
                                        if (log.user.role === "admin") return { label: "Адміністратор", color: "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300" };
                                        if (log.user.role === "commandant") return { label: "Комендант", color: "bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300" };
                                        return { label: "Студент", color: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" };
                                    })();

                                    return (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-slate-50/60 dark:hover:bg-gray-700/30 transition-colors group"
                                        >
                                            {/* Користувач / Автор дії */}
                                            <td className="py-3.5 px-5 align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-gray-700 dark:to-gray-600 text-slate-700 dark:text-slate-200 font-black text-[11px] flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-gray-600 shadow-2xs">
                                                        {getInitials(log.user?.name)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="text-gray-900 dark:text-white font-bold text-xs truncate">
                                                                {log.user ? log.user.name : "Автоматична дія"}
                                                            </span>
                                                            <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded-md ${roleBadge.color}`}>
                                                                {roleBadge.label}
                                                            </span>
                                                        </div>
                                                        <div className="text-[10.5px] text-gray-400 font-medium truncate mt-0.5">
                                                            {log.user ? log.user.email : "Фоновий процес сервісу"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Дія / Статус */}
                                            <td className="py-3.5 px-5 align-top">
                                                <div className="space-y-1">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border ${badgeClass} shadow-2xs`}
                                                    >
                                                        {actionInfo.icon}
                                                        <span>{actionInfo.label}</span>
                                                    </span>
                                                    <div className="text-[9.5px] font-mono text-slate-400 dark:text-gray-500 uppercase tracking-wider pl-1">
                                                        {log.action}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Подробиці події */}
                                            <td className="py-3.5 px-5 align-top text-gray-600 dark:text-gray-300 text-xs">
                                                {renderFormattedDetails(log.details)}
                                            </td>

                                            {/* Дата та час */}
                                            <td className="py-3.5 px-5 align-top text-right whitespace-nowrap">
                                                <div
                                                    className="inline-block cursor-default group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors"
                                                    title={dateInfo.full}
                                                >
                                                    <div className="font-semibold text-gray-700 dark:text-gray-300 text-xs">
                                                        {dateInfo.relative}
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                                                        {dateInfo.full.split(",")[0]}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. ПАНЕЛЬ ПАГІНАЦІЇ */}
                {filteredLogs.length > 0 && (
                    <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-2">
                            <span>
                                Показано{" "}
                                <strong className="font-bold text-gray-800 dark:text-gray-200">
                                    {(currentPage - 1) * perPage + 1}
                                </strong>{" "}
                                -{" "}
                                <strong className="font-bold text-gray-800 dark:text-gray-200">
                                    {Math.min(currentPage * perPage, filteredLogs.length)}
                                </strong>{" "}
                                із{" "}
                                <strong className="font-bold text-gray-800 dark:text-gray-200">
                                    {filteredLogs.length}
                                </strong>
                            </span>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-gray-600 disabled:opacity-35 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Попередня сторінка"
                                >
                                    &larr;
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                    .map((p, idx, arr) => (
                                        <React.Fragment key={p}>
                                            {idx > 0 && p - arr[idx - 1] > 1 && (
                                                <span className="px-1 text-gray-400">...</span>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPage(p)}
                                                className={`min-w-[32px] px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                    currentPage === p
                                                        ? "bg-emerald-600 text-white shadow-xs"
                                                        : "border border-slate-200 dark:border-gray-600 hover:bg-slate-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                                }`}
                                            >
                                                {p}
                                            </button>
                                        </React.Fragment>
                                    ))}
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-gray-600 disabled:opacity-35 hover:bg-slate-50 dark:hover:bg-gray-700 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Наступна сторінка"
                                >
                                    &rarr;
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 5. МОДАЛЬНЕ ВІКНО ПІДТВЕРДЖЕННЯ ОЧИЩЕННЯ ЖУРНАЛУ */}
            {isClearModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
                    <div
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-slate-100 dark:border-gray-700 max-w-md w-full p-6 space-y-4 animate-scale-up"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-100 dark:border-rose-900/50">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>

                        <div className="text-center space-y-1.5">
                            <h3 className="text-lg font-black text-gray-900 dark:text-white">
                                Очистити журнал аудиту?
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Ви збираєтесь видалити всі поточні записи дій ({auditLogs.length} записів). Цю операцію <span className="font-bold text-rose-600 dark:text-rose-400">неможливо скасувати</span>.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsClearModalOpen(false)}
                                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700/60 transition-colors"
                            >
                                Скасувати
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsClearModalOpen(false);
                                    if (handleClearLogs) handleClearLogs();
                                }}
                                className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all shadow-md shadow-rose-600/20 active:scale-95"
                            >
                                Так, очистити
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
