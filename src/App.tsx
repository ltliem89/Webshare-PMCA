/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FilterState,
  Language,
  LANGUAGE_CODES,
  ViewMode,
  WebProject,
} from './types';
import { INITIAL_PROJECTS } from './data/initialData';
import { localizeProject } from './data/projectLocalizations';
import { translations } from './translations';
import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { ProjectCard } from './components/ProjectCard';
import { TimelineLayerCard } from './components/TimelineLayerCard';
import { CompactListItem } from './components/CompactListItem';
import { QRCodeModal } from './components/QRCodeModal';
import { SubmitModal } from './components/SubmitModal';
import { AdminModal } from './components/AdminModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { Globe, Plus, Sparkles } from 'lucide-react';
import {
  getStoredScriptUrl,
  isAutoSyncEnabled,
  pushSingleProjectToSheet,
  upsertProjectToSheet,
  fetchProjectsFromSheet,
  fetchSubmissionsFromSheet,
  deleteSubmissionsFromSheet,
  updateStatsInSheet,
} from './services/googleSync';
import { getWebsiteScreenshotUrl } from './utils/screenshot';
import {
  isCommunityApprovedOnly,
  setCommunityApprovedOnly,
} from './config';

const STORAGE_KEY_PROJECTS = 'webhub_projects_data_v3';
const STORAGE_KEY_LANG = 'webhub_language_preference';
const STORAGE_KEY_ADMIN = 'webhub_admin_session';

// Helper to ensure famous platforms and community submissions are cleanly separated
const sanitizeAndMigrateProjects = (loadedList: WebProject[]): WebProject[] => {
  // Các dữ liệu mẫu cũ đã được gỡ khỏi bản khởi tạo (demo bài đăng tải, pending, mục ghép cũ)
  const deprecatedSampleIds = new Set<string>([
    'proj-phys-1',
    'proj-chem-1',
    'proj-math-1',
    'proj-bio-1',
    'proj-hist-1',
    'proj-lit-1',
    'proj-eng-1',
    'proj-pending-1',
  ]);

  const famousKeywords = [
    'phet',
    'geogebra',
    'netsim',
    'packet-tracer',
    'falstad',
    'desmos',
    'scratch',
    'biodigital',
    'algorithm-visualizer',
    'molview',
  ];

  const initialFamous = INITIAL_PROJECTS.filter((p) => p.isFamous);

  const updated: WebProject[] = loadedList
    .filter((p) => !deprecatedSampleIds.has(p.id))
    .map((p) => {
      const isFamousMatch = famousKeywords.some(
        (kw) =>
          p.url.toLowerCase().includes(kw) ||
          p.id.toLowerCase().includes(kw) ||
          p.title.toLowerCase().includes(kw)
      );
      const isFamousActual = isFamousMatch || !!p.isFamous;
      // Giữ dữ liệu cũ: bài approved không nổi tiếng → coi là bài admin đã duyệt
      // (các bài mẫu khởi tạo đều là famous nên không bị tính nhầm)
      const isUserSubmission =
        p.isUserSubmission === true ||
        (p.status === 'approved' && !isFamousActual);
      return {
        ...p,
        isFamous: isFamousActual,
        isUserSubmission,
      };
    });

  // Ensure all standard famous simulations from INITIAL_PROJECTS are included
  for (const fam of initialFamous) {
    if (!updated.some((p) => p.id === fam.id || p.url === fam.url)) {
      updated.push(fam);
    }
  }

  return updated;
};

export default function App() {
  // 1. Language state
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    // Tránh giá trị cũ (ja/fr) không còn được hỗ trợ → quay về tiếng Việt
    return LANGUAGE_CODES.includes(saved as Language) ? (saved as Language) : 'vi';
  });

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem(STORAGE_KEY_LANG, newLang);
  };

  const t = translations[lang];

  // 2. Admin Authentication State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ADMIN) === 'true';
  });

  const handleSetIsAdmin = (val: boolean) => {
    setIsAdmin(val);
    localStorage.setItem(STORAGE_KEY_ADMIN, val ? 'true' : 'false');
  };

  // Biến kiểm soát chế độ cộng đồng: tab "Bài đăng tải" chỉ hiển thị bài admin duyệt
  const [communityOnly, setCommunityOnly] = useState<boolean>(() =>
    isCommunityApprovedOnly()
  );

  const handleCommunityOnlyChange = (val: boolean) => {
    setCommunityApprovedOnly(val);
    setCommunityOnly(val);
  };

  // 3. Projects State (Loaded from localStorage with clean migration across all versions or Initial Seed)
  const [projects, setProjects] = useState<WebProject[]>(() => {
    try {
      const storageKeys = [
        'webhub_projects_data_v4',
        'webhub_projects_data_v3',
        'webhub_projects_data_v2',
        'webhub_projects_data_v1',
        'webhub_projects_data',
      ];
      const mergedList: WebProject[] = [];
      for (const key of storageKeys) {
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              for (const item of parsed) {
                if (
                  item &&
                  item.id &&
                  !mergedList.some(
                    (existing) => existing.id === item.id || existing.url === item.url
                  )
                ) {
                  // Giữ nguyên trạng thái (approved / pending / rejected) khi tải lại
                  mergedList.push({ ...item });
                }
              }
            }
          } catch {
            // ignore JSON error
          }
        }
      }

      if (mergedList.length > 0) {
        return sanitizeAndMigrateProjects(mergedList);
      }
    } catch {
      // Fallback
    }
    return INITIAL_PROJECTS;
  });

  // Save projects to localStorage whenever changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [projects]);

  // Theo dõi các thay đổi Views/Likes cục bộ chưa kịp đồng bộ lên Google Sheets.
  const statsDirtyRef = useRef<Map<string, { views: number; likes: number }>>(new Map());
  const statsTimerRef = useRef<number | null>(null);

  const flushStatsSync = useCallback(() => {
    if (statsTimerRef.current !== null) {
      window.clearTimeout(statsTimerRef.current);
      statsTimerRef.current = null;
    }
    const dirty = statsDirtyRef.current;
    if (dirty.size === 0) return;
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      const items = Array.from(dirty.entries()).map(([projectId, s]) => ({
        projectId,
        views: s.views,
        likes: s.likes,
      }));
      updateStatsInSheet(scriptUrl, items);
    }
    dirty.clear();
  }, []);

  // Gộp các thay đổi stats và gửi lên Sheets sau 4 giây trễ (debounce)
  const markStatsDirty = useCallback(
    (id: string, views: number, likes: number) => {
      const prev = statsDirtyRef.current.get(id) || { views: 0, likes: 0 };
      statsDirtyRef.current.set(id, {
        views: Math.max(prev.views, views),
        likes: Math.max(prev.likes, likes),
      });
      if (statsTimerRef.current !== null) window.clearTimeout(statsTimerRef.current);
      statsTimerRef.current = window.setTimeout(flushStatsSync, 4000);
    },
    [flushStatsSync]
  );

  // Dọn dẹp timer và đẩy stats còn dang dở khi đóng trang
  useEffect(() => {
    const flushOnUnload = () => {
      const dirty = statsDirtyRef.current;
      if (dirty.size === 0) return;
      const scriptUrl = getStoredScriptUrl();
      if (!scriptUrl || !isAutoSyncEnabled()) return;
      const items = Array.from(dirty.entries()).map(([projectId, s]) => ({
        projectId,
        views: s.views,
        likes: s.likes,
      }));
      updateStatsInSheet(scriptUrl, items);
    };
    window.addEventListener('beforeunload', flushOnUnload);
    return () => {
      window.removeEventListener('beforeunload', flushOnUnload);
      if (statsTimerRef.current !== null) window.clearTimeout(statsTimerRef.current);
    };
  }, []);

  // 4. View Mode & Filter State
  const [viewMode, setViewMode] = useState<ViewMode>('expanded');
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    category: 'ALL',
    educationLevel: 'ALL',
    sortBy: 'newest',
    onlyFamous: false,
  });

  // 5. Modals State
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isGoogleSyncOpen, setIsGoogleSyncOpen] = useState(false);
  const [selectedQRProject, setSelectedQRProject] = useState<WebProject | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<WebProject | null>(null);

  /**
   * Kéo các bài CHỜ DUYỆT / TỪ CHỐI từ tab WebHub_Submissions trên Google Sheets về
   * và hợp nhất vào state local. Nhờ vậy admin mở trên thiết bị BẤT KỲ nào
   * cũng thấy được bài mà người dùng vừa gửi từ thiết bị khác (cross-device).
   */
  const syncPendingFromCloud = useCallback(() => {
    const scriptUrl = getStoredScriptUrl();
    if (!scriptUrl || !isAutoSyncEnabled()) return;

    return fetchSubmissionsFromSheet(scriptUrl)
      .then((result) => {
        if (!result.success || !result.data) return;
        setProjects((prev) => {
          const cloudProjects = result.data as WebProject[];
          let changed = false;
          const merged = [...prev];
          for (const cp of cloudProjects) {
            // Bỏ qua bài đã APPROVED còn sót trong tab chờ duyệt (đã chuyển sang
            // WebHub_Projects khi admin duyệt) — tránh hiện nhầm trong danh sách chờ.
            if (cp.status !== 'pending' && cp.status !== 'rejected') continue;
            const idx = merged.findIndex((p) => p.id === cp.id);
            // Chỉ thêm/cập nhật bài CHƯA duyệt (pending/rejected) tới từ đám mây,
            // tránh đè lên dữ liệu approved đang hiển thị.
            const effectiveStatus =
              cp.status === 'rejected' ? 'rejected' : 'pending';
            if (idx >= 0) {
              if (
                merged[idx].status === 'pending' ||
                merged[idx].status === 'rejected'
              ) {
                merged[idx] = { ...merged[idx], ...cp, status: effectiveStatus };
                changed = true;
              }
            } else {
              merged.push({ ...cp, status: effectiveStatus });
              changed = true;
            }
          }
          return changed ? merged : prev;
        });
      })
      .catch((err) => {
        console.warn('Background pending sync notice:', err);
      });
  }, []);

  // Background non-blocking auto-sync from Google Sheets on initial load
  useEffect(() => {
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      fetchProjectsFromSheet(scriptUrl)
        .then((result) => {
          if (!result.success || !result.data || result.data.length === 0) return;
          setProjects((prev) => {
            const cloudApproved = result.data as WebProject[];
            const merged = [...prev];
            let changed = false;
            for (const cp of cloudApproved) {
              const idx = merged.findIndex((p) => p.id === cp.id);
              if (idx >= 0) {
                if (merged[idx].status !== 'approved') {
                  merged[idx] = { ...merged[idx], ...cp, status: 'approved' };
                  changed = true;
                } else {
                  // Giữ số liệu Views/Likes cao hơn để không bị giảm sau khi reload
                  const keepMax = {
                    views: Math.max(merged[idx].views, cp.views),
                    likes: Math.max(merged[idx].likes, cp.likes),
                  };
                  if (JSON.stringify(merged[idx]) !== JSON.stringify({ ...cp, ...keepMax })) {
                    merged[idx] = { ...cp, ...keepMax };
                    changed = true;
                  }
                }
              } else {
                merged.push({ ...cp, status: 'approved' });
                changed = true;
              }
            }
            return changed ? merged : prev;
          });
        })
        .catch((err) => {
          console.warn('Background Google Sheets sync notice:', err);
        });
      // Đồng thời kéo danh sách bài chờ duyệt từ đám mây về
      syncPendingFromCloud();
    }
  }, [syncPendingFromCloud]);

  // Định kỳ (mỗi 45 giây) tải lại dữ liệu ĐÃ DUYỆT từ Google Sheets.
  // Nhờ vậy khi admin duyệt bài ở bất kỳ thiết bị nào, các thiết bị khác
  // sẽ tự động cập nhật và hiển thị bài ngay mà không cần reload trang.
  useEffect(() => {
    const scriptUrl = getStoredScriptUrl();
    if (!scriptUrl || !isAutoSyncEnabled()) return;

    const pollApproved = () => {
      fetchProjectsFromSheet(scriptUrl)
        .then((result) => {
          if (!result.success || !result.data) return;
          setProjects((prev) => {
            let cloudApproved = result.data as WebProject[];
            let changed = false;
            const merged = [...prev];

            // Ghép bài đã duyệt từ đám mây (giữ lại pending/rejected local)
            for (let cp of cloudApproved) {
              // Đừng để dữ liệu đám mây ghi đè Views/Likes local chưa kịp đồng bộ
              const dirty = statsDirtyRef.current.get(cp.id);
              if (dirty) {
                cp = {
                  ...cp,
                  views: Math.max(cp.views, dirty.views),
                  likes: Math.max(cp.likes, dirty.likes),
                };
              }
              const idx = merged.findIndex((p) => p.id === cp.id);
              if (idx >= 0) {
                if (merged[idx].status !== 'approved') {
                  merged[idx] = { ...merged[idx], ...cp, status: 'approved' };
                  changed = true;
                } else {
                  // Cập nhật nội dung nhưng giữ status approved
                  if (JSON.stringify(merged[idx]) !== JSON.stringify(cp)) {
                    merged[idx] = cp;
                    changed = true;
                  }
                }
              } else {
                merged.push({ ...cp, status: 'approved' });
                changed = true;
              }
            }
            return changed ? merged : prev;
          });
        })
        .catch((err) => {
          console.warn('Polling approved sync notice:', err);
        });
    };

    pollApproved();
    const interval = setInterval(pollApproved, 45000);
    return () => clearInterval(interval);
  }, []);

  // 6. Action Handlers
  const handleLike = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, likes: p.likes + 1 } : p))
    );
    const p = projects.find((x) => x.id === projectId);
    if (p) markStatsDirty(projectId, p.views, p.likes + 1);
  };

  const handleVisit = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, views: p.views + 1 } : p))
    );
    const p = projects.find((x) => x.id === projectId);
    if (p) markStatsDirty(projectId, p.views + 1, p.likes);
  };

  const handleSubmitNewProject = (
    data: Omit<WebProject, 'id' | 'createdAt' | 'views' | 'likes'>
  ) => {
    // Tự tạo ảnh đại diện (screenshot) nếu người dùng không tải ảnh lên
    const thumbnail =
      (data.previewImage && data.previewImage.trim()) ||
      getWebsiteScreenshotUrl(data.url);

    const newProject: WebProject = {
      ...data,
      id: `proj-${Date.now()}`,
      status: 'pending', // Chờ admin duyệt trước khi hiển thị công khai
      isUserSubmission: true, // Bài người dùng đăng → thuộc tab "Bài đăng tải" khi được duyệt
      createdAt: new Date().toISOString(),
      views: 1,
      likes: 0,
      previewImage: thumbnail,
    };
    setProjects((prev) => [newProject, ...prev]);
    // Chuyển về tab "Bài đăng tải" mặc định
    setFilters((prev) => ({ ...prev, onlyFamous: false }));

    // Đẩy bài mới (trạng thái pending) lên Google Sheets nếu đã cấu hình
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      pushSingleProjectToSheet(scriptUrl, newProject);
    }
  };

  const handleApprove = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );

    // Đồng bộ toàn bộ thông tin bài (gồm ảnh đại diện) lên Google Sheets
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      // Bài được admin duyệt → luôn coi là bài cộng đồng (hiển thị ở "Bài đăng tải")
      upsertProjectToSheet(scriptUrl, {
        ...project,
        status: 'approved',
        isUserSubmission: true,
      });
      // Sau khi duyệt, kéo lại danh sách chờ duyệt từ đám mây
      syncPendingFromCloud();
    }
  };

  const handleReject = (id: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'rejected' } : p))
    );

    // Đồng bộ trạng thái từ chối (kèm toàn bộ thông tin) lên Google Sheets
    const project = projects.find((p) => p.id === id);
    if (!project) return;
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      upsertProjectToSheet(scriptUrl, { ...project, status: 'rejected' });
      // Sau khi từ chối, kéo lại danh sách chờ duyệt từ đám mây
      syncPendingFromCloud();
    }
  };

  const handleConfirmDelete = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));

    // Đồng bộ xóa lên Google Sheets (cả tab đã duyệt lẫn chờ duyệt)
    // để bài đã xóa không quay lại khi tải dữ liệu từ Sheets / duyệt từ xa.
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      deleteSubmissionsFromSheet(scriptUrl, [id]);
    }
  };

  const handleUpdateProject = (updated: WebProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    const scriptUrl = getStoredScriptUrl();
    if (scriptUrl && isAutoSyncEnabled()) {
      upsertProjectToSheet(scriptUrl, updated);
    }
  };

  const handleExportData = () => {
    const jsonStr = JSON.stringify(projects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `webhub-data-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (imported: WebProject[]) => {
    setProjects(imported);
    alert(t.amImportSuccess.replace('{count}', String(imported.length)));
  };

  const handleResetData = () => {
    if (window.confirm(t.amResetConfirm)) {
      setProjects(INITIAL_PROJECTS);
      localStorage.removeItem(STORAGE_KEY_PROJECTS);
    }
  };

  // 7. Filtering & Sorting Logic
  const approvedProjects = useMemo(
    () => projects.filter((p) => p.status === 'approved'),
    [projects]
  );
  const localizedProjects = useMemo(
    () => approvedProjects.map((p) => localizeProject(p, lang)),
    [approvedProjects, lang]
  );
  const defaultApprovedCount = useMemo(
    () =>
      approvedProjects.filter(
        (p) => !p.isFamous && (communityOnly ? p.isUserSubmission : true)
      ).length,
    [approvedProjects, communityOnly]
  );
  const famousCount = useMemo(
    () => approvedProjects.filter((p) => !!p.isFamous).length,
    [approvedProjects]
  );

  const filteredProjects = useMemo(() => {
    return localizedProjects
      .filter((project) => {
        // Nếu người dùng bật nút "Nổi tiếng": hiển thị các mô phỏng nổi tiếng (PhET, GeoGebra, NetSim...)
        // Mặc định: hiển thị các bài do admin duyệt (tab "Bài đăng tải" - chế độ cộng đồng)
        if (filters.onlyFamous) {
          if (!project.isFamous) return false;
        } else {
          if (project.isFamous) return false;
          // BIẾN KIỂM SOÁT CỘNG ĐỒNG: nếu bật, chỉ hiện bài người dùng đăng đã duyệt,
          // mọi bài mẫu (không phải nổi tiếng) đều bị ẩn khỏi tab "Bài đăng tải".
          if (communityOnly && !project.isUserSubmission) return false;
        }

        // Category / Subject filter
        if (filters.category !== 'ALL') {
          const cat = filters.category;
          const subjectAliases: Record<string, string[]> = {
            toan: ['toan', 'math'],
            vat_ly: ['vat_ly', 'physics', 'stem'],
            hoa_hoc: ['hoa_hoc', 'chemistry'],
            sinh_hoc: ['sinh_hoc', 'biology', 'health_medicine'],
            tin_hoc: ['tin_hoc', 'informatics', 'computer_science'],
            ngu_van: ['ngu_van', 'literature'],
            tieng_anh: ['tieng_anh', 'english', 'languages'],
            lich_su: ['lich_su', 'history', 'history_society'],
            dia_li: ['dia_li', 'geography'],
            khtn_stem: ['khtn_stem', 'stem', 'natural_sciences'],
            cong_nghe: ['cong_nghe', 'tools_utilities'],
            khac: ['khac', 'general', 'arts_design'],
          };
          const matches = (subjectAliases[cat] || [cat]).includes(project.category);
          if (!matches) return false;
        }

        // Education Level filter
        if (
          filters.educationLevel !== 'ALL' &&
          project.educationLevel !== filters.educationLevel
        ) {
          return false;
        }

        // Search Query
        if (filters.searchQuery.trim() !== '') {
          const query = filters.searchQuery.toLowerCase();
          const matchTitle = project.title.toLowerCase().includes(query);
          const matchDesc = project.description.toLowerCase().includes(query);
          const matchAuthor = project.authorName.toLowerCase().includes(query);
          const matchUrl = project.url.toLowerCase().includes(query);
          const matchTags = project.tags.some((tag) =>
            tag.toLowerCase().includes(query)
          );
          if (!matchTitle && !matchDesc && !matchAuthor && !matchUrl && !matchTags) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'newest') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (filters.sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (filters.sortBy === 'most_liked') {
          return b.likes - a.likes;
        }
        if (filters.sortBy === 'most_viewed') {
          return b.views - a.views;
        }
        return 0;
      });
  }, [localizedProjects, filters, communityOnly]);

  const pendingCount = projects.filter((p) => p.status === 'pending').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Header */}
      <Header
        lang={lang}
        onLanguageChange={handleLanguageChange}
        searchQuery={filters.searchQuery}
        onSearchChange={(query) => setFilters({ ...filters, searchQuery: query })}
        isAdmin={isAdmin}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenSubmit={() => setIsSubmitOpen(true)}
        pendingCount={pendingCount}
        onOpenGoogleSync={() => setIsGoogleSyncOpen(true)}
        hasGoogleSync={Boolean(getStoredScriptUrl())}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Streamlined Banner Hero */}
        <StatsBanner
          projects={projects}
          lang={lang}
          onOpenSubmit={() => setIsSubmitOpen(true)}
        />

        {/* Filter and View Mode Switcher */}
        <FilterBar
          filters={filters}
          onFilterChange={setFilters}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          lang={lang}
          totalResults={filteredProjects.length}
          approvedCount={defaultApprovedCount}
          famousCount={famousCount}
          onOpenSubmit={() => setIsSubmitOpen(true)}
        />

        {/* Empty State */}
        {filteredProjects.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-3">
              <Globe className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {t.noWebsitesFound}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              {t.emptyStateHint}
            </p>
            <div className="flex items-center justify-center space-x-3">
              <button
                onClick={() =>
                  setFilters({
                    searchQuery: '',
                    category: 'ALL',
                    educationLevel: 'ALL',
                    sortBy: 'newest',
                    onlyFamous: false,
                  })
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {t.clearFilters}
              </button>
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-xs"
              >
                {t.submitWebsite}
              </button>
            </div>
          </div>
        ) : (
          /* Render based on View Mode: Expanded (Đầy đủ mockup, QR, mô tả) vs Compact (Chỉ Tên & Lĩnh vực) */
          <>
            {viewMode === 'expanded' ? (
              <div
                id="projects-expanded-view"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            ) : (
              <div id="projects-compact-view" className="space-y-2 max-w-4xl mx-auto">
                {filteredProjects.map((project) => (
                  <CompactListItem
                    key={project.id}
                    project={project}
                    lang={lang}
                    isAdmin={isAdmin}
                    onOpenQR={(p) => setSelectedQRProject(p)}
                    onDeleteRequest={(p) => setProjectToDelete(p)}
                    onLike={handleLike}
                    onVisit={handleVisit}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-slate-200/80 py-8 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">{t.appName}</span>
            <span>—</span>
            <span>{t.appTagline}</span>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <button
              onClick={() => setIsAdminOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              {isAdmin ? t.adminMode : t.adminPortal}
            </button>
            <span>•</span>
            <button
              onClick={() => setIsSubmitOpen(true)}
              className="text-slate-600 hover:text-slate-900"
            >
              {t.submitWebsite}
            </button>
            <span>•</span>
            <span className="text-slate-400">{t.footerReady}</span>
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      <QRCodeModal
        project={selectedQRProject}
        isOpen={!!selectedQRProject}
        onClose={() => setSelectedQRProject(null)}
        lang={lang}
      />

      {/* Website Submission Modal */}
      <SubmitModal
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        onSubmit={handleSubmitNewProject}
        lang={lang}
        isAdmin={isAdmin}
      />

      {/* Admin Panel & Moderation Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        isAdmin={isAdmin}
        setIsAdmin={handleSetIsAdmin}
        projects={projects}
        onApprove={handleApprove}
        onReject={handleReject}
        onDeleteRequest={(p) => setProjectToDelete(p)}
        onUpdateProject={handleUpdateProject}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onResetData={handleResetData}
        onSyncProjects={(syncedProjects) => setProjects(syncedProjects)}
        onRefreshPending={syncPendingFromCloud}
        communityOnly={communityOnly}
        onCommunityOnlyChange={handleCommunityOnlyChange}
        lang={lang}
      />

      {/* Google Sheets Apps Script Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncOpen}
        onClose={() => setIsGoogleSyncOpen(false)}
        projects={projects}
        onSyncProjects={(syncedProjects) => setProjects(syncedProjects)}
        lang={lang}
      />

      {/* Delete Confirmation Modal (Admin safety requirement) */}
      <DeleteConfirmModal
        project={projectToDelete}
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleConfirmDelete}
        lang={lang}
      />
    </div>
  );
}
