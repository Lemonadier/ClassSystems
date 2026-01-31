/**
 * Configuration, Constants & State
 */

const SYSTEMS = {
    bank: { 
        name_en: "Financial", name_th: "การเงิน", icon: "fa-vault", color: "bg-indigo-600",
        unit: "฿", isCumulative: true, 
        stat1: "Net Balance", stat2: "Entries"
    },
    attendance: { 
        name_en: "Attendance", name_th: "เช็คชื่อ", icon: "fa-calendar-check", color: "bg-emerald-600",
        unit: "%", isCumulative: false,
        stat1: "Attendance Rate", stat2: "Days Logged"
    },
    health: { 
        name_en: "Health (BMI)", name_th: "สุขภาพ", icon: "fa-heart-pulse", color: "bg-rose-600",
        unit: "BMI", isCumulative: false,
        stat1: "Avg BMI", stat2: "Measurements"
    },
    profile: { 
        name_en: "Profile", name_th: "ประวัติ", icon: "fa-user-astronaut", color: "bg-amber-600",
        unit: "Pts", isCumulative: false,
        stat1: "Avg Intel", stat2: "Mood Logs"
    }
};

const i18n = {
    en: {
        app_name: "Banyuak System", app_subtitle: "Integrated Management", api_not_connected: "API Not Connected",
        role_student: "Student / Parent", role_teacher: "Teacher",
        label_student_id: "Student ID", btn_view_wallet: "Enter System",
        label_access_pin: "Admin Key", btn_enter_dashboard: "Login", btn_setup: "Setup",
        nav_dashboard: "Dashboard", nav_students: "Data", nav_history: "History", nav_settings: "Settings", nav_logout: "Logout",
        title_overview: "Overview", section_actions: "Quick Actions", label_active_system: "Active System",
        btn_new_tx: "New Entry", btn_add_student: "Add Student", btn_batch_add: "Batch Add", btn_batch_tx: "Batch Entry",
        modal_settings_title: "Settings", label_api_url: "API URL", label_new_key: "Admin Key", btn_copy_link: "Copy Link",
        btn_cancel: "Cancel", btn_save: "Save", btn_confirm: "Confirm", btn_submit: "Submit",
        err_select_student: "Select a student", msg_setup_required: "First Time Setup:", msg_create_admin: "Create Admin Key",
        label_student: "Student", label_date: "Date", btn_switch_sys: "Switch System", launcher_title: "Select Module",
        // System Specific
        label_deposit: "Deposit", label_withdraw: "Withdraw", label_present: "Present", label_late: "Late", label_absent: "Absent",
        label_weight: "Weight (kg)", label_height: "Height (cm)", label_mood: "Mood", label_intel: "Intel Score"
    },
    th: {
        app_name: "Banyuak System", app_subtitle: "ระบบบริหารจัดการรวม", api_not_connected: "ยังไม่เชื่อมต่อ API",
        role_student: "นักเรียน / ผู้ปกครอง", role_teacher: "ครูผู้สอน",
        label_student_id: "รหัสนักเรียน", btn_view_wallet: "เข้าสู่ระบบ",
        label_access_pin: "รหัส Admin", btn_enter_dashboard: "เข้าสู่ระบบ", btn_setup: "ตั้งค่า",
        nav_dashboard: "ภาพรวม", nav_students: "ข้อมูล", nav_history: "ประวัติ", nav_settings: "ตั้งค่า", nav_logout: "ออกระบบ",
        title_overview: "ภาพรวม", section_actions: "เมนูด่วน", label_active_system: "ระบบทำงาน",
        btn_new_tx: "เพิ่มข้อมูล", btn_add_student: "เพิ่มนักเรียน", btn_batch_add: "เพิ่มหมู่", btn_batch_tx: "บันทึกหมู่",
        modal_settings_title: "ตั้งค่า", label_api_url: "ลิงก์ API", label_new_key: "คีย์ผู้ดูแล", btn_copy_link: "คัดลอกลิงก์",
        btn_cancel: "ยกเลิก", btn_save: "บันทึก", btn_confirm: "ยืนยัน", btn_submit: "ตกลง",
        err_select_student: "เลือกนักเรียน", msg_setup_required: "เริ่มใช้งาน:", msg_create_admin: "สร้างรหัส Admin",
        label_student: "นักเรียน", label_date: "วันที่", btn_switch_sys: "สลับระบบ", launcher_title: "เลือกเมนู",
        // System Specific
        label_deposit: "ฝาก", label_withdraw: "ถอน", label_present: "มา", label_late: "สาย", label_absent: "ขาด",
        label_weight: "น้ำหนัก (กก.)", label_height: "ส่วนสูง (ซม.)", label_mood: "อารมณ์", label_intel: "คะแนนทักษะ"
    }
};

const CONFIG = {
    get apiUrl() { return localStorage.getItem('cb_api_url') || ''; },
    get adminKey() { return localStorage.getItem('cb_session_token') || ''; },
    get lang() { return localStorage.getItem('cb_lang') || 'en'; },
    role: null, user: null, activeSystem: null, sessionTimeout: 20 * 60 * 1000, version: 'v1.0'
};

const state = { students: [], transactions: [], tableMode: 'students', isFetching: false, chartType: 'bar' };
