export type ProjectCategory = 'school' | 'work' | 'personal'

export interface Project {
  id: string
  title: string
  description: string
  tech: string[]
  date: string
  category: ProjectCategory
  link?: string
  highlight?: boolean
}

export interface Skill {
  name: string
  level: 'expert' | 'advanced' | 'learning'
}

export interface TimelineItem {
  id: string
  date: string
  title: string
  description: string
}

export interface SocialLink {
  label: string
  url: string
  icon: string
}

export const portfolio = {
  name: 'TÔ Trung Hiếu',
  nickname: 'PoPi',
  fullName: 'TÔ Trung Hiếu — PoPi',
  logo: '/logo.jpg',
  tagline: 'Mong muốn trở thành người hiểu biết thật nhiều trong lĩnh vực Công Nghệ Thông Tin, không riêng gì Web Developer',
  about: [
    'Tôi là một người làm việc dùng AI để làm việc — dùng kiến thức về CNTT để yêu cầu AI làm việc cho mình.',
    'Mạnh ở Laravel và Node.js, đang học thêm .NET. Tôi tin rằng công nghệ là công cụ, và kiến thức rộng mới là mục tiêu.',
    'Ngoài việc làm việc tại Đại Học Võ Trường Toản, tôi còn nhận freelance từ tháng 11/2025 đến hiện tại.',
  ],
  email: 'popivn.dev@gmail.com',
  location: 'Cần Thơ, Việt Nam',
  socials: [
    { label: 'GitHub', url: 'https://github.com/popivn', icon: 'fa-brands fa-github' },
    { label: 'TaskTracking', url: 'https://tasktracking-jade.vercel.app/', icon: 'fa-solid fa-list-check' },
    { label: 'Notepad', url: 'https://notepad-theta-pied.vercel.app/', icon: 'fa-solid fa-note-sticky' },
    { label: 'Cronhub', url: 'https://popihub-jlil.onrender.com/#dashboard', icon: 'fa-solid fa-clock-rotate-left' },
  ] as SocialLink[],
  skills: [
    { name: 'Laravel', level: 'expert' },
    { name: 'Node.js', level: 'expert' },
    { name: 'NestJS', level: 'advanced' },
    { name: 'TypeScript', level: 'advanced' },
    { name: 'Blazor', level: 'advanced' },
    { name: '.NET', level: 'learning' },
    { name: 'SCSS', level: 'advanced' },
    { name: 'Bootstrap', level: 'expert' },
    { name: 'Tailwind CSS', level: 'advanced' },
    { name: 'Firebase', level: 'advanced' },
    { name: 'Cron Jobs', level: 'advanced' },
    { name: 'AI-Assisted Dev', level: 'expert' },
  ] as Skill[],
  timeline: [
    {
      id: 'edu-btec',
      date: '10/2022 — 04/2025',
      title: 'Cao Đẳng Anh Quốc BTEC FPT Cần Thơ',
      description: 'Hành trình học tập chính thức, hoàn thành vào tháng 4/2025.',
    },
    {
      id: 'work-vtt',
      date: '07/2025 — Hiện tại',
      title: 'Lập trình viên — Đại Học Võ Trường Toản',
      description: 'Phát triển các hệ thống quản lý học liệu, xét miễn học phần, thư viện số.',
    },
    {
      id: 'freelance',
      date: '11/2025 — Hiện tại',
      title: 'Freelancer',
      description: 'Nhận dự án ngoài giờ, kết hợp AI để tối ưu năng suất.',
    },
  ] as TimelineItem[],
  projects: [
    {
      id: 'sims',
      title: 'SIMS — Hệ thống Quản lý Sinh viên',
      description: 'Dự án học đường tâm đắc nhất. Hệ thống quản lý sinh viên toàn diện xây dựng bằng .NET + Blazor.',
      tech: ['.NET', 'Blazor', 'C#'],
      date: '2023 — 2025',
      category: 'school',
      link: 'https://github.com/popivn/Student-Information-Management-System.git',
      highlight: true,
    },
    {
      id: 'pizza-o',
      title: 'Pizza O',
      description: 'Dự án đầu tay kiếm ra tiền thật — cơ hội làm cho khách nước ngoài. Xây dựng bằng Laravel + SCSS.',
      tech: ['Laravel', 'SCSS', 'PHP'],
      date: '10/2023',
      category: 'work',
      highlight: true,
    },
    {
      id: 'bmk-logistics',
      title: 'BMK — Logistics',
      description: 'Hệ thống tracking hàng hóa từ điểm A đến điểm B qua quét mã QR — nhập kho, xuất kho. Làm cho công ty logistics BMK.',
      tech: ['Laravel', 'Bootstrap', 'PHP'],
      date: '11/2024',
      category: 'work',
    },
    {
      id: 'hoc-lieu',
      title: 'Quản Lý Học Liệu — VTT',
      description: 'Hệ thống lưu trữ tài liệu số, kiểm soát quá trình học của sinh viên trên hệ thống như Udemy.',
      tech: ['Laravel', 'Bootstrap', 'PHP'],
      date: '07/2025',
      category: 'work',
    },
    {
      id: 'xet-mien',
      title: 'Xét Miễn Học Phần',
      description: 'Quản lý sinh viên đăng ký xét miễn môn, đóng tiền, ban ngành duyệt xét và công bố kết quả. Học được sức mạnh của cronjob.',
      tech: ['Laravel', 'Bootstrap', 'Cron Jobs'],
      date: '09/2025',
      category: 'work',
    },
    {
      id: 'thu-vien-vtt',
      title: 'Thư Viện Số Đại Học VTT',
      description: 'Quản lý số lượng lớn sách và tài liệu số của thư viện. Hệ thống hỗ trợ đầy đủ đặc thù thư viện — sinh viên xem và mượn sách tối ưu.',
      tech: ['Laravel', 'Tailwind CSS', 'PHP'],
      date: '07/2026',
      category: 'work',
      link: 'http://library.vttu.edu.vn/',
      highlight: true,
    },
    {
      id: 'tasktracking',
      title: 'TaskTracking',
      description: 'Dự án cá nhân phục vụ quá trình học tập và làm việc — quản lý công việc.',
      tech: ['TypeScript', 'Vite'],
      date: 'Cá nhân',
      category: 'personal',
      link: 'https://tasktracking-jade.vercel.app/',
    },
    {
      id: 'notepad',
      title: 'Notepad',
      description: 'Ứng dụng ghi chú cá nhân, deployed trên Vercel.',
      tech: ['TypeScript', 'Vite'],
      date: 'Cá nhân',
      category: 'personal',
      link: 'https://notepad-theta-pied.vercel.app/',
    },
    {
      id: 'cronhub',
      title: 'Cronhub',
      description: 'Dashboard quản lý cron jobs — dự án cá nhân deployed trên Render.',
      tech: ['Node.js', 'TypeScript'],
      date: 'Cá nhân',
      category: 'personal',
      link: 'https://popihub-jlil.onrender.com/#dashboard',
    },
    {
      id: 'nks5',
      title: 'NKS5 — Guild Tool',
      description: 'Dự án hỗ trợ các thành viên trong Guild khi chơi game. Cung cấp công cụ quản lý và phối hợp hoạt động guild hiệu quả.',
      tech: ['Node.js', 'TypeScript'],
      date: 'Cá nhân',
      category: 'personal',
      link: 'https://nks5.onrender.com/',
    },
  ] as Project[],
}
