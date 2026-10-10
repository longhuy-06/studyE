import React from 'react';

interface PublicFooterProps {
  onNavigate: (path: string) => void;
}

export const PublicFooter: React.FC<PublicFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#f1f3ff] py-12 mt-16 border-t border-[#e1e8ff]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('landing')}>
              <div className="w-7 h-7 rounded-lg bg-[#0650cc] flex items-center justify-center text-white font-bold text-sm">
                L
              </div>
              <span className="font-bold text-lg text-[#0650cc]">LinguaNext</span>
            </div>
            <p className="text-sm text-[#434654] leading-relaxed">
              Nền tảng ứng dụng AI hỗ trợ phân tích phát âm IPA, sửa lỗi ngữ pháp tự nhiên và đồng hành luyện giao tiếp 24/7 cho người Việt.
            </p>
            <p className="text-xs text-[#737685] font-medium">
              Đề tài: Xây dựng web học tiếng Anh tích hợp trí tuệ nhân tạo
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-[#0f1b34] mb-3">Sản phẩm &amp; Học tập</h4>
            <ul className="space-y-2 text-sm text-[#434654]">
              <li>
                <button onClick={() => onNavigate('vocabulary')} className="hover:text-[#0650cc] transition-colors">
                  Học từ vựng Spaced Repetition
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('listening')} className="hover:text-[#0650cc] transition-colors">
                  Luyện nghe đục lỗ &amp; Dictation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('writing')} className="hover:text-[#0650cc] transition-colors">
                  Chữa bài viết AI tức thì
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('conversation')} className="hover:text-[#0650cc] transition-colors">
                  Chatbot gia sư đàm thoại 24/7
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-[#0f1b34] mb-3">Thông tin &amp; Dự án</h4>
            <ul className="space-y-2 text-sm text-[#434654]">
              <li>
                <a href="#about-team" className="hover:text-[#0650cc] transition-colors">
                  Về nhóm nghiên cứu phát triển
                </a>
              </li>
              <li>
                <span className="text-[#434654]">Đại học Công Nghiệp Hà Nội</span>
              </li>
              <li>
                <span className="text-[#434654]">Tài liệu API AI Core (Gemini)</span>
              </li>
              <li>
                <span className="text-[#434654]">Chính sách bảo mật &amp; SSL</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-[#0f1b34] mb-3">Kết nối &amp; Hỗ trợ</h4>
            <p className="text-sm text-[#434654] mb-3">
              Cộng đồng người học và hỗ trợ kỹ thuật trực tuyến 24/7.
            </p>
            <div className="flex items-center gap-2">
              <a
                href="mailto:support@linguanext.edu.vn"
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#434654] hover:text-[#0650cc] hover:bg-[#e1e8ff] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">mail</span>
              </a>
              <button
                onClick={() => onNavigate('conversation')}
                className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-[#434654] hover:text-[#0650cc] hover:bg-[#e1e8ff] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-base">forum</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#e1e8ff] flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-[#737685]">
          <p>© 2026 LinguaNext. Bản quyền thuộc về dự án.</p>
          <p>Thiết kế phù hợp với sinh viên Việt Nam học tiếng Anh.</p>
        </div>
      </div>
    </footer>
  );
};
