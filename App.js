import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Animated,
  ScrollView,
  Alert,
  RefreshControl,
  ImageBackground,
  TextInput,
  Modal,
  Switch,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import * as Clipboard from 'expo-clipboard';
import moment from 'moment';
import { Provider as PaperProvider } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import FormattedText from './components/FormattedText';
import { db } from './firebaseConfig';
import { collection, doc, getDoc, setDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';

// --- SVG Icon Definitions ---
const homeIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/></svg>`;
const assignmentsIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
const scheduleIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>`;
const menuIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`;
const CopyIconXml = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g id="Edit / Copy"> <path id="Vector" d="M9 9V6.2002C9 5.08009 9 4.51962 9.21799 4.0918C9.40973 3.71547 9.71547 3.40973 10.0918 3.21799C10.5196 3 11.0801 3 12.2002 3H17.8002C18.9203 3 19.4801 3 19.9079 3.21799C20.2842 3.40973 20.5905 3.71547 20.7822 4.0918C21.0002 4.51962 21.0002 5.07967 21.0002 6.19978V11.7998C21.0002 12.9199 21.0002 13.48 20.7822 13.9078C20.5905 14.2841 20.2839 14.5905 19.9076 14.7822C19.4802 15 18.921 15 17.8031 15H15M9 9H6.2002C5.08009 9 4.51962 9 4.0918 9.21799C3.71547 9.40973 3.40973 9.71547 3.21799 10.0918C3 10.5196 3 11.0801 3 12.2002V17.8002C3 18.9203 3 19.4801 3.21799 19.9079C3.40973 20.2842 3.71547 20.5905 4.0918 20.7822C4.5192 21 5.07899 21 6.19691 21H11.8036C12.9215 21 13.4805 21 13.9079 20.7822C14.2842 20.5905 14.5905 20.2839 14.7822 19.9076C15 19.4802 15 18.921 15 17.8031V15M9 9H11.8002C12.9203 9 13.4801 9 13.9079 9.21799C14.2842 9.40973 14.5905 9.71547 14.7822 10.0918C15 10.5192 15 11.079 15 12.1969L15 15" stroke="#A0A0A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g> </g></svg>`;
const shopIconXml = `<svg version="1.0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><path fill="#FFFFFF" d="M48,24h16V4c0-2.211-1.789-4-4-4H48V24z"/><rect x="24" fill="#FFFFFF" width="16" height="24"/><path fill="#FFFFFF" d="M16,24V0H4C1.789,0,0,1.789,0,4v20H16z"/><path fill="#FFFFFF" d="M4,32v28c0,2.211,1.789,4,4,4h16V44h16v20h16c2.211,0,4-1.789,4-4V32H4z"/></svg>`;

// --- Configuration ---
const BASE_URL = 'https://miamicountryday.myschoolapp.com';
const LOGIN_URL = `${BASE_URL}/app?svcid=edu#login`;
const CONTEXT_API_URL = `${BASE_URL}/api/webapp/context`;
const ASSIGNMENTS_API_URL = `${BASE_URL}/api/assignment2/StudentAssignmentCenterGet?displayByDueDate=true`;
const ASSIGNMENT_DETAIL_API_URL = `${BASE_URL}/api/assignment2/UserAssignmentDetailsGetAllStudentData`;
const SCHEDULE_API_URL = `${BASE_URL}/api/schedule/MyDayCalendarStudentList/`;
const GRADES_API_URL = `${BASE_URL}/api/datadirect/ParentStudentUserClassesGet`;
const GRADE_DETAILS_API_URL = `${BASE_URL}/api/gradebook/AssignmentPerformanceStudent`;
const MESSAGES_API_URL = `${BASE_URL}/api/message/inbox/?format=json`;
const USER_STATUS_API_URL = `${BASE_URL}/api/webapp/userstatus`;
const APP_HOME_URL_FRAGMENT = '/app/';

const APP_VERSION = '1.7.9';

const CHANGELOG_DATA = [
  { version: '1.7.9', changes: ['Added autologin', 'Added new message notification badge', 'Fixed message details not loading or looking weird', 'other bug fixes'] },
  { version: '1.7.8', changes: ['Fixed gpa not bieng accurate', 'other bug fixes'] },
  { version: '1.7.7', changes: ['Added change assignment status', 'Added ability to send POST requests to the server', 'Added the ability to send messages', 'Lots of bug fixes'] },
  { version: '1.7.6', changes: ['Fixed clicker saving too much', 'Added custom app backgrounds', 'Added dark/tinted icons'] },
  { version: '1.7.5', changes: ['Added shop for clicker', 'added useless tips'] },
  { version: '1.7.5', changes: ['Fixed score not saving correctly', 'fixed webview offset'] },
  { version: '1.7.4', changes: ['Added Messages Page', 'also added clicker game cuz I got bored and why not'] },
  { version: '1.7.3', changes: ['Added text Formatting and styling for descriptions, etc.'] },
  { version: '1.7.2', changes: ['Added preview mode'] },
  { version: '1.7.1', changes: ['Added Grades page', 'Added GPA calculator (Grades)', 'Added Back button', 'Fixed login crash'] },
  { version: '1.7.0', changes: ['Added UpdateCheck', 'Fixed assignment description not loading', 'Added pull down to refresh'] },
  { version: '1.6.9', changes: ['Added the Resources page for easy accses to announcements and more', 'Added more user info such as email and graduation year', 'Fixed assignments before last week not loading in', 'Added ability to copy email'] },
  { version: '1.6.8', changes: ['Fixed app name not showing on iOS'] },
  { version: '1.6.7', changes: ['Fixed ReferenceError for assignment details.', 'SIX SEVEN!!!'] },
  { version: '1.6.6', changes: ['Added secret changelog page', 'Fixed bottom safe area layout', 'Fixed home page text centering', 'Updated to `react-native-safe-area-context`'] },
  { version: '1.6.5', changes: ['Removed assignment status update functionality due to constant bugs.'] },
  { version: '1.6.4', changes: ['Restored the persistent hidden WebView logic to fix API calls for assignments and schedule.'] },
  { version: '1.6.3', changes: ['Fixed SafeAreaView layout to remove top/bottom gaps.', 'Centered version info on More page.', 'Added full changelog history.'] },
  { version: '1.6.2', changes: ['Added secret changelog page (long-press).', 'Updated to `react-native-safe-area-context`.'] },
  { version: '1.5.0', changes: ['Added functional Schedule page with daily navigation.'] },
  { version: '1.4.0', changes: ['Restored stable URL-detection login logic.', 'Added interactive Assignment Detail modal & status updates.'] },
];

const AppWrapper = () => (
  <SafeAreaProvider>
    <App />
  </SafeAreaProvider>
);

const App = () => {
  const [authStatus, setAuthStatus] = useState('LOGGED_OUT');
  const [loginReason, setLoginReason] = useState('Please sign in to continue.');
  const [userInfo, setUserInfo] = useState(null);
  const [activePage, setActivePage] = useState('Home');
  const [assignments, setAssignments] = useState(null);
  const [assignmentDetails, setAssignmentDetails] = useState({});
  const [schedule, setSchedule] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isChangelogVisible, setIsChangelogVisible] = useState(false);
  const [grades, setGrades] = useState(null);
  const [selectedCourseDetails, setSelectedCourseDetails] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [messages, setMessages] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [backgroundUri, setBackgroundUri] = useState(null);
  const [blurAmount, setBlurAmount] = useState(0);
  const [showTips, setShowTips] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const [fetchAllMessages, setFetchAllMessages] = useState(false);
  const [isReloginMode, setIsReloginMode] = useState(false);

  const [allRecipients, setAllRecipients] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const richRef = useRef();

  const resetWebViewToBase = () => {
    if (webviewRef.current) {
      console.log('[WebView] Resetting to base URL...');
      webviewRef.current.stopLoading?.();
      webviewRef.current.injectJavaScript(`
        window.location.href = '${LOGIN_URL}';
        true;
      `);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const savedUri = await AsyncStorage.getItem('userBackground');
        const savedBlur = await AsyncStorage.getItem('userBlur');

        if (savedUri) setBackgroundUri(savedUri);
        if (savedBlur) setBlurAmount(parseFloat(savedBlur));
      } catch (err) {
        console.warn('Failed to load background settings:', err);
      }
    })();
  }, []);

  const autoClickLogin = `
    (function() {
      let retries = 0;
      const maxRetries = 2; // Try again 2 times

      function attemptLogin() {
        const emailInput = document.getElementById('Username');
        const rememberCheckbox = document.getElementById('remember');
        const nextBtn = document.getElementById('nextBtn');

        // Check if elements exist
        if (!emailInput || !rememberCheckbox || !nextBtn) return false;

        // Check conditions: Email filled AND Remember me checked
        const ready = (emailInput.value.trim().length > 0) && rememberCheckbox.checked;

        if (ready) {
          nextBtn.focus();
          const opts = { bubbles: true, cancelable: true, view: window };
          nextBtn.dispatchEvent(new MouseEvent('mousedown', opts));
          nextBtn.dispatchEvent(new MouseEvent('mouseup', opts));
          nextBtn.dispatchEvent(new MouseEvent('click', opts));
          
          // Tell React Native we finished
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTO_LOGIN_COMPLETE', success: true }));
          return true;
        }
        return false;
      }

      // 1. Try immediately
      if (attemptLogin()) return;

      // 2. If failed, start interval (1 second delay)
      const interval = setInterval(() => {
        retries++;
        const success = attemptLogin();
        
        if (success) {
          clearInterval(interval);
        } else if (retries >= maxRetries) {
          // Stop trying after 2 retries
          clearInterval(interval);
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'AUTO_LOGIN_COMPLETE', success: false }));
        }
      }, 1000); // 1000ms = 1 second
    })();
  `;

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('fetchAllMessages');
      if (saved !== null) setFetchAllMessages(saved === 'true');
    })();
  }, []);

  // Function to fetch CSRF token using the WebView context
  const fetchCsrfToken = () => {
    if (!webviewRef.current) {
      console.warn('WebView not ready to fetch CSRF token.');
      return;
    }

    const script = `
      fetch("https://miamicountryday.myschoolapp.com/api/security/csrftoken", {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json, text/plain, */*'
        }
      })
      .then(res => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(token => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'CSRF_TOKEN',
          data: token,
          success: true
        }));
      })
      .catch(err => {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'API_ERROR',
          error: err.message
        }));
      });
      true;
    `;

    console.log('[CSRF] Fetching new token...');
    webviewRef.current.injectJavaScript(script);
  };
  useEffect(() => {
    const loadSettings = async () => {
      const savedTips = await AsyncStorage.getItem('showTips');
      if (savedTips !== null) setShowTips(savedTips === 'true');
    };
    loadSettings();
  }, []);

  const webviewRef = useRef(null);

  const fetchApiInWebView = (url, type = 'GENERIC', options = {}) => {
    if (previewMode) return;
    setIsLoading(true);
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : null;
    const script = `
      fetch("${url}", { 
        method: '${method}',
        headers: { 
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json, text/javascript, */*; q=0.01', 
          'X-Requested-With': 'XMLHttpRequest' 
        },
        ${body ? `body: JSON.stringify(${body})` : ''}
      })
      .then(response => {
        if (!response.ok) throw new Error('HTTP Status ' + response.status);
        return response.text();
      })
      .then(data => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${type}', data: data, success: true, requestUrl: "${url}" }));
      })
      .catch(error => {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'API_ERROR', error: error.message }));
      });
      true;
    `;
    console.log('[WebView Fetch]', type, url);
    webviewRef.current?.injectJavaScript(script);
  };

  const postApiInWebView = (url, type = 'GENERIC', body = {}) => {
    if (!csrfToken) {
      console.warn('[POST DEBUG] Missing CSRF token — aborting.');
      return;
    }

    const debugScript = `
    console.log('[POST DEBUG] Sending POST to: ${url}');
    console.log('[POST DEBUG] Body:', ${JSON.stringify(body)});
    console.log('[POST DEBUG] Token:', '${csrfToken}');

    fetch("${url}", {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'requestverificationtoken': '${csrfToken}'
      },
      body: JSON.stringify(${JSON.stringify(body)})
    })
    .then(async (r) => {
      const text = await r.text();
      console.log('[POST DEBUG] Status:', r.status);
      console.log('[POST DEBUG] Response text:', text.slice(0, 500)); // limit to 500 chars
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: '${type}',
        status: r.status,
        success: r.ok,
        data: text
      }));
    })
    .catch(e => {
      console.log('[POST DEBUG] ERROR:', e.message);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'API_ERROR',
        error: e.message
      }));
    });
    true;
  `;

    console.log('[WebView POST]', type, url, body);
    webviewRef.current?.injectJavaScript(debugScript);
  };

  useEffect(() => {
    if (authStatus === 'LOGGED_IN') {
      fetchCsrfToken(); // Retrieve fresh token immediately after login
    }
  }, [authStatus]);


  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === 'CSRF_TOKEN') {
        setCsrfToken(message.data?.replace(/"/g, '').trim());
        console.log('[CSRF TOKEN SAVED]', message.data);
        return; // stop here, don’t parse further
      }

      const triggerRelogin = (reason) => {
        setIsLoading(false);
        setUserInfo(null);
        setAssignments(null);
        setSchedule({});
        setAuthStatus('LOGGED_OUT');
        setLoginReason(reason);
        console.log('[Relogin] Triggered.');
        setIsReloginMode(true);
        setIsLoggedIn(false);
        clearSessionCookies();
        resetWebViewToBase();  // only this first redirect
      };

      if (message.type === 'API_ERROR') {
        triggerRelogin(`API Error: ${message.error}. Please sign in.`);
        return;
      }

      if (message.success) {
        // console.log('[POST RESPONSE]', message.status, message.data);
        let responseData;
        try { responseData = JSON.parse(message.data); }
        catch (e) { triggerRelogin('Failed to parse a server response. Please sign in again.'); return; }

        if (responseData.Error) { triggerRelogin('Your session has expired. Please sign in again.'); return; }

        if (message.type === 'CONTEXT') {
          setUserInfo(responseData.UserInfo);
          setAuthStatus('LOGGED_IN');
        } else if (message.type === 'ASSIGNMENTS') {
          setAssignments(responseData);
        } else if (message.type === 'STATUS_UPDATE') {
          fetchApiInWebView(ASSIGNMENTS_API_URL, 'ASSIGNMENTS');
        } else if (message.type === 'SCHEDULE') {
          const dateMatch = message.requestUrl.match(/scheduleDate=([\d%F]+)/);
          if (dateMatch) {
            const dateKey = decodeURIComponent(dateMatch[1]);
            setSchedule(prev => ({ ...prev, [dateKey]: responseData }));
          }
        } else if (message.type === 'ASSIGNMENT_DETAIL') {
          setAssignmentDetails(prev => ({ ...prev, [responseData.AssignmentIndexId]: responseData }));
        }
        else if (message.type === 'GRADES') {
          setGrades(responseData);
        }
        else if (message.type === 'GRADE_DETAILS') {
          setSelectedCourseDetails(responseData);
        }
        else if (message.type === 'MESSAGES') {
          setMessages(responseData);
        }
        else if (message.type === 'USER_STATUS') {
          setUnreadCount(responseData.UnreadMessageCount || 0);
        }
        else if (message.type === 'FETCH_RECIPIENTS') {
          try {
            const parsed = Array.isArray(responseData)
              ? responseData
              : JSON.parse(responseData || '[]');
            console.log('[Recipients] Loaded', parsed.length);
            setAllRecipients(parsed); // 👈 no renaming, keep keys as-is
          } catch (err) {
            console.warn('Failed to parse recipients:', err);
          }
        }
        setIsLoading(false);
      }
    } catch (e) { /* Ignore non-JSON messages */ }
  };

  useEffect(() => {
    const loadBackground = async () => {
      const savedBlur = await AsyncStorage.getItem('userBlur');
      try {
        const savedUri = await AsyncStorage.getItem('userBackground');
        if (savedUri) setBackgroundUri(savedUri);
      } catch (error) {
        console.error('Error loading background:', error);
      }
      setBlurAmount(parseFloat(savedBlur));
    };
    loadBackground();
  }, []);


  const handleNavigationStateChange = (navState) => {

    // If the page finished loading and we are at the login base URL
    if (!navState.loading && navState.url === LOGIN_URL) {
      // Small delay to ensure the DOM is fully interactive
      setTimeout(() => {
        webviewRef.current?.injectJavaScript(autoClickLogin);
        console.log('[AutoLogin] Activated');
      }, 1700);
    }
    // existing logic to detect login
    if (!navState.loading && navState.url.includes(APP_HOME_URL_FRAGMENT) && authStatus === 'LOGGED_OUT') {
      setAuthStatus('LOGGING_IN');
    }
  };

  useEffect(() => {
    if (authStatus === 'LOGGING_IN' && !userInfo) {
      fetchApiInWebView(CONTEXT_API_URL, 'CONTEXT');
      fetchApiInWebView(USER_STATUS_API_URL, 'USER_STATUS');
    }
  }, [authStatus]);

  const fetchAssignmentsCallback = useCallback(() => {
    fetchApiInWebView(ASSIGNMENTS_API_URL, 'ASSIGNMENTS');
  }, []);


  const fetchScheduleCallback = useCallback((dateString) => {
    const url = `${SCHEDULE_API_URL}?scheduleDate=${encodeURIComponent(dateString)}&personaId=2`;
    if (!schedule[dateString]) fetchApiInWebView(url, 'SCHEDULE');
  }, []);

  const fetchAssignmentDetailsCallback = useCallback((assignmentIndexId) => {
    if (!userInfo) {
      console.warn('[FetchDetail] No user info, aborting');
      return;
    }
    const url = `${ASSIGNMENT_DETAIL_API_URL}?assignmentIndexId=${assignmentIndexId}&studentUserId=${userInfo.UserId}&personaId=2`;
    console.log('[FetchDetail] Requesting details for', assignmentIndexId, 'URL:', url);
    fetchApiInWebView(url, 'ASSIGNMENT_DETAIL');
  }, [userInfo]);

  const fetchGradesCallback = useCallback(() => {
    if (!userInfo) return;
    const url = `${GRADES_API_URL}?userId=${userInfo.UserId}&memberLevel=3&persona=2&durationList=172113`;
    fetchApiInWebView(url, 'GRADES');
  }, [userInfo]);

  const fetchGradeDetails = useCallback((sectionId, markingPeriodId, studentId) => {
    const url = `${GRADE_DETAILS_API_URL}?sectionId=${sectionId}&markingPeriodId=${markingPeriodId}&studentId=${studentId}`;
    fetchApiInWebView(url, 'GRADE_DETAILS');
  }, []);

  const fetchMessagesCallback = useCallback((page = 1) => {
    const baseUrl = 'https://miamicountryday.myschoolapp.com/api/message/inbox/?format=json';
    const url = fetchAllMessages ? baseUrl : `${baseUrl}&pageNumber=${page}`;
    console.log('[FetchMessages]', fetchAllMessages ? 'ALL' : `page ${page}`, url);
    fetchApiInWebView(url, 'MESSAGES');
  }, [fetchAllMessages]);

  // --- Update check on app launch ---
  useEffect(() => {
    const compareVersions = (a, b) => {
      const pa = a.split('.').map(Number);
      const pb = b.split('.').map(Number);
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff) return diff > 0 ? 1 : -1;
      }
      return 0;
    };

    const checkForUpdate = async () => {
      try {
        const response = await fetch('https://boosterfrank.vercel.app/mobile/mcds/ver.txt');
        const latestVersion = (await response.text()).trim();
        console.log('[VersionCheck] Current:', APP_VERSION, '| Latest:', latestVersion);

        if (compareVersions(latestVersion, APP_VERSION) > 0) {
          Alert.alert(
            'Update Available',
            `A new version (${latestVersion}) of MCDS Mobile is available.\nYou are currently on ${APP_VERSION}. Please go to update it.`,
            [{ text: 'OK' }],
          );
        }
      } catch (err) {
        console.warn('[VersionCheck] Failed:', err);
      }
    };

    checkForUpdate();
  }, []);

  useEffect(() => {
    if (previewMode) {
      console.log('[PreviewMode] Activating Preview Data');
      setUserInfo({
        FirstName: 'User',
        LastName: 'Preview',
        Email: 'upreview29@miamicountryday.org',
        StudentInfo: { GradYear: '2030' },
      });

      setAssignments({
        DueToday: [
          {
            AssignmentIndexId: 1,
            GroupName: 'Mathematics - H',
            ShortDescription: 'Algebra Worksheet',
            LongDescription: "Good evening Upper School,&nbsp;\u003Cbr\u003EI'm excited to announce that I am hosting another \u003Cb\u003EFishing Competition\u003C/b\u003E on \u003Cb\u003EFisher Island\u003C/b\u003E on \u003Cb\u003ENovember 16 from 10am-12pm\u003C/b\u003E!&nbsp;\u003Cbr\u003E\u003Cbr\u003EThe last one was such a success and it was so nice to see your support.&nbsp;\u003Cbr\u003EYou can earn \u003Cb\u003E10 service hours\u003C/b\u003E by coming to the event. All you have to do is \u003Cb\u003Eregister\u003C/b\u003E by zelleing \u003Cb\u003Elena@bigdreamscf.org\u003C/b\u003E $100 and sending me the confirmation at 786 847 3178.&nbsp;\u003Cbr\u003E\u003Cbr\u003EThe purpose of the event is to continue to raise money to \u003Cb\u003Ereopen the operating room\u003C/b\u003E at Clinica Santa Rosa De Lima. I am visiting the clinic in November over Thanksgiving Break and want to raise the most money I can before my trip there. I am super excited to donate the \u003Cb\u003Efirst 10k\u003C/b\u003E that you all helped me raise.&nbsp;\u003Cbr\u003E\u003Cbr\u003EI hope to see you at the fishing competition. Reach out if you have any questions.&nbsp",
            DateDue: '10/08/2025 11:59 PM',
            AssignmentStatusType: 0
          },
        ],
        PastThisWeek: [],
        PastBeforeLastWeek: [],
        PastLastWeek: [],
        Overdue: [],
        DueTomorrow: [],
        DueThisWeek: [],
        DueNextWeek: [],
        DueAfterNextWeek: [],
      });

      setSchedule({
        '10/07/2025': [
          {
            CourseTitle: 'Preview Science',
            Contact: 'Dr. Smith',
            MyDayStartTime: '10:00 AM',
            MyDayEndTime: '11:00 AM',
            BuildingName: 'Science Center',
            RoomNumber: '201',
            Block: 'B'
          },
        ]
      });

      setGrades([
        { sectionidentifier: 'Biology - AP', cumgrade: 95, groupownername: 'Mr. Turner', room: 'Lab 1', currentterm: 'Q1', sectionid: 1, markingperiodid: 123 },
        { sectionidentifier: 'Algebra II - H', cumgrade: 92, groupownername: 'Ms. Rivera', room: 'A103', currentterm: 'Q1', sectionid: 2, markingperiodid: 123 },
      ]);
    }
  }, [previewMode]);


  return (
    <ImageBackground
      source={backgroundUri ? { uri: backgroundUri } : null}
      style={styles.appContainer}
      resizeMode="cover"
    >
      <PaperProvider>
        {blurAmount > 0 && (
          <BlurView intensity={blurAmount * 5} style={StyleSheet.absoluteFill} pointerEvents="none" />
        )}

        <StatusBar barStyle={authStatus === 'LOGGED_IN' ? "light-content" : "dark-content"} />
        <Modal visible={isChangelogVisible} animationType="slide">
          <ChangelogPage onClose={() => setIsChangelogVisible(false)} />
        </Modal>

        {/* Persistent WebView is always rendered. It's hidden with styling when logged in. */}
        <View style={authStatus === 'LOGGED_IN' ? styles.webviewHidden : styles.webviewVisible}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <View style={styles.loginHeader}>
              <Text style={styles.loginTitle}>MCDS Mobile</Text>
              {authStatus === 'LOGGED_OUT' && <Text style={styles.subtitle}>{loginReason}</Text>}
              <TouchableOpacity onPress={() => { setPreviewMode(true); setAuthStatus('LOGGED_IN'); }} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            </View>
            <WebView
              ref={webviewRef}
              source={{ uri: LOGIN_URL }}
              onMessage={handleWebViewMessage}
              onNavigationStateChange={handleNavigationStateChange}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              originWhitelist={['*']}
            />
            {authStatus === 'LOGGING_IN' && <LoadingOverlay text="Verifying session..." />}
          </SafeAreaView>
        </View>

        {/* Main app content is only displayed on top when fully logged in */}
        {authStatus === 'LOGGED_IN' && userInfo && (
          <View style={{ flex: 1 }}>
            <SafeAreaView />
            <View style={styles.appHeader}>
              <Text style={styles.appTitle}>MCDS Mobile</Text>
            </View>

            {previewMode && (
              <View style={{ backgroundColor: '#FFD60A', padding: 6 }}>
                <Text style={{ color: '#000', textAlign: 'center', fontWeight: '600' }}>
                  Preview Mode — Data is shown not real
                </Text>
              </View>
            )}

            <PageContent
              activePage={activePage}
              userInfo={userInfo}
              assignments={assignments}
              fetchAssignments={fetchAssignmentsCallback}
              schedule={schedule}
              fetchSchedule={fetchScheduleCallback}
              grades={grades}
              fetchGrades={fetchGradesCallback}
              fetchGradeDetails={fetchGradeDetails}
              isLoading={isLoading}
              assignmentDetails={assignmentDetails}
              fetchAssignmentDetails={fetchAssignmentDetailsCallback}
              messages={messages}
              fetchMessages={fetchMessagesCallback}
              onOpenChangelog={() => setIsChangelogVisible(true)}
              onNavigate={setActivePage}
              selectedMessage={selectedMessage}
              setSelectedMessage={setSelectedMessage}
              backgroundUri={backgroundUri}
              blurAmount={blurAmount}
              setBackgroundUri={setBackgroundUri}
              setBlurAmount={setBlurAmount}
              postApiInWebView={postApiInWebView}
              fetchAllMessages={fetchAllMessages}
              setFetchAllMessages={setFetchAllMessages}
              fetchApiInWebView={fetchApiInWebView}
              allRecipients={allRecipients}
              setAllRecipients={setAllRecipients}
              richRef={richRef}
              unreadCount={unreadCount}
            />
            <GradeDetailsModal
              visible={!!selectedCourseDetails}
              details={selectedCourseDetails}
              onClose={() => setSelectedCourseDetails(null)}
            />
            <View style={{ backgroundColor: styles.navBar.backgroundColor }}>
              <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
              <SafeAreaView style={{ backgroundColor: styles.navBar.backgroundColor }} edges={['bottom']} />
            </View>
          </View>
        )}
      </PaperProvider>
    </ImageBackground>
  );
};

const BackHeader = ({ title, onBack }) => (
  <View style={styles.backHeader}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Text style={styles.backArrow}>{'‹'}</Text>
      <Text style={styles.backText}>Back</Text>
    </TouchableOpacity>
    <Text style={styles.backHeaderTitle}>{title}</Text>
    <View style={{ width: 60 }} />
  </View>
);

// --- Page Content Wrapper with Transitions ---
const PageContent = ({ activePage, userInfo, richRef, assignments, postApiInWebView, fetchAllMessages, setFetchAllMessages, fetchAssignments, assignmentDetails, fetchAssignmentDetails, schedule, fetchSchedule, isLoading, onOpenChangelog, onNavigate, grades, fetchGrades, fetchGradeDetails, messages, fetchMessages, selectedMessage, setSelectedMessage, backgroundUri, blurAmount, setBackgroundUri, setBlurAmount, fetchApiInWebView, setAllRecipients, allRecipients, unreadCount }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [activePage]);

  let currentPageComponent;
  switch (activePage) {
    case 'Home': currentPageComponent = <HomePage userInfo={userInfo} unreadCount={unreadCount} onNavigate={onNavigate} />; break;
    case 'Assignments': currentPageComponent = <AssignmentCenterPage postApiInWebView={postApiInWebView} assignments={assignments} fetchAssignments={fetchAssignments} isLoading={isLoading} assignmentDetails={assignmentDetails} fetchAssignmentDetails={fetchAssignmentDetails} />; break;
    case 'Schedule': currentPageComponent = <SchedulePage scheduleData={schedule} fetchSchedule={fetchSchedule} isLoading={isLoading} />; break;
    case 'More':
      currentPageComponent = (
        <MorePage onOpenChangelog={onOpenChangelog} onNavigate={onNavigate} />
      );
      break;
    case 'Grades':
      currentPageComponent = (
        <GradesPage
          userInfo={userInfo}
          onNavigateBack={() => onNavigate('More')}
          grades={grades}
          fetchGrades={fetchGrades}
          fetchGradeDetails={fetchGradeDetails}
          isLoading={isLoading}
        />
      );
      break;
    case 'Messages':
      currentPageComponent = (
        <MessagesPage
          messages={messages}
          fetchMessages={fetchMessages}
          selectedMessage={selectedMessage}
          setSelectedMessage={setSelectedMessage}
          isLoading={isLoading}
          onNavigateBack={() => onNavigate('More')}
          postApiInWebView={postApiInWebView}
          fetchAllMessages={fetchAllMessages}
          fetchApiInWebView={fetchApiInWebView}
          setAllRecipients={setAllRecipients}
          allRecipients={allRecipients}
        />
      );
      break;
    case 'ClickGame':
      currentPageComponent = (
        <ClickGamePage
          userInfo={userInfo}
          onNavigateBack={() => onNavigate('More')}
        />
      );
      break;
    case 'Settings':
      currentPageComponent = (
        <SettingsPage
          onNavigateBack={() => onNavigate('More')}
          backgroundUri={backgroundUri}
          blurAmount={blurAmount}
          setBackgroundUri={setBackgroundUri}
          setBlurAmount={setBlurAmount}
          fetchAllMessages={fetchAllMessages}
          setFetchAllMessages={setFetchAllMessages}
        />
      );
      break;
    case 'Resources':
      currentPageComponent = (
        <ResourcesPage onNavigateBack={() => onNavigate('More')} />
      );
      break;
    default: currentPageComponent = <PlaceholderPage title="Not Found" onNavigateBack={() => onNavigate('More')} />;
  }

  return <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>{currentPageComponent}</Animated.View>;
};

// --- Components ---
const LoadingOverlay = ({ text }) => <View style={styles.loadingOverlay}><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.loadingText}>{text}</Text></View>;
const HomePage = ({ userInfo, unreadCount, onNavigate }) => {
  const photoUrl = `${BASE_URL}${userInfo.ProfilePhoto?.LargeFilenameEditedUrl}`;
  return (
    <View style={[styles.pageContentContainer, { justifyContent: 'center' }]}>
      <Text style={styles.greeting}>Hey, {userInfo.FirstName}!</Text>
      <TouchableOpacity onPress={() => onNavigate('Messages')}>
        {userInfo.ProfilePhoto?.LargeFilenameEditedUrl ? (
          <View>
            <Image source={{ uri: photoUrl }} style={styles.profileImage} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        ) : (
          <View>
            <View style={[styles.profileImage, styles.profileImagePlaceholder]}><Text style={styles.profileImagePlaceholderText}>{userInfo.FirstName.charAt(0)}</Text></View>
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      <View style={styles.emailRow}>
        <TouchableOpacity
          style={styles.emailTouchable}
          onPress={async () => {
            await Clipboard.setStringAsync(userInfo.Email);
            Alert.alert('Copied', 'Your email has been copied to the clipboard.');
          }}
        >
          <View style={styles.emailInner}>
            <Text style={styles.emailText}>{userInfo.Email}</Text>
            <SvgXml xml={CopyIconXml} width={18} height={18} style={styles.copyIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <Text style={styles.pageContentText}>Class of {userInfo.StudentInfo?.GradYear}</Text>
    </View>
  );
};

const SchedulePage = ({ scheduleData, fetchSchedule, isLoading }) => {
  const [currentDate, setCurrentDate] = useState(moment());
  const dateKey = currentDate.format('M/D/YYYY');
  const scheduleForDay = scheduleData[dateKey];
  useEffect(() => { if (!scheduleData[dateKey]) fetchSchedule(dateKey); }, [currentDate]);
  const changeDay = (amount) => setCurrentDate(prev => prev.clone().add(amount, 'day'));
  const courseColors = useRef({}).current;
  const getColorForCourse = (courseTitle) => {
    if (courseColors[courseTitle]) return courseColors[courseTitle];
    const colors = ['#007AFF', '#34C759', '#AF52DE', '#FF9500', '#FF3B30', '#5AC8FA', '#FFCC00'];
    const hash = courseTitle.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    courseColors[courseTitle] = colors[Math.abs(hash) % colors.length];
    return courseColors[courseTitle];
  };
  return (
    <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
      <Text style={styles.pageTitle}>My Schedule</Text>
      <View style={styles.dateNavigator}>
        <TouchableOpacity onPress={() => changeDay(-1)} style={styles.dateNavButton}><Text style={styles.dateNavText}>{'< Prev'}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentDate(moment())}><Text style={styles.dateHeaderText}>{currentDate.isSame(moment(), 'day') ? 'Today' : currentDate.format('ddd, MMM D')}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => changeDay(1)} style={styles.dateNavButton}><Text style={styles.dateNavText}>{'Next >'}</Text></TouchableOpacity>
      </View>
      <ScrollView
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => fetchSchedule(currentDate.format('M/D/YYYY'))}
            tintColor="#FFFFFF"
          />
        }
      >
        {isLoading && !scheduleForDay ? (
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 40 }} />
        ) : scheduleForDay && scheduleForDay.length > 0 ? (
          scheduleForDay.map((item, index) => (
            <View key={index} style={styles.scheduleCard}>
              <View style={[styles.scheduleColorBar, { backgroundColor: getColorForCourse(item.CourseTitle) }]} />
              <View style={styles.scheduleTime}>
                <Text style={styles.scheduleTimeText}>{item.MyDayStartTime}</Text>
                <Text style={styles.scheduleTimeText}>{item.MyDayEndTime}</Text>
              </View>
              <View style={styles.scheduleDetails}>
                <Text style={styles.scheduleCourseTitle}>{item.CourseTitle}</Text>
                <Text style={styles.scheduleSubText}>{item.Contact}</Text>
                <Text style={styles.scheduleSubText}>
                  {item.BuildingName} - {item.RoomNumber}
                </Text>
              </View>
              <View style={styles.scheduleBlock}>
                <Text style={styles.scheduleBlockText}>{item.Block}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noAssignmentsText}>No classes scheduled for this day.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const AssignmentCenterPage = ({ assignments, fetchAssignments, setAssignments, postApiInWebView, updateStatus, isLoading, assignmentDetails, fetchAssignmentDetails }) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  useEffect(() => {
    if (!assignments) {
      fetchAssignments();
    }
  }, []);

  const handleSelectAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    // Fetch details if we don't have them already
    if (!assignmentDetails[assignment.AssignmentIndexId]) {
      fetchAssignmentDetails(assignment.AssignmentIndexId);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    if (selectedAssignment) {
      updateStatus(selectedAssignment.AssignmentIndexId, newStatus);
    }
    setSelectedAssignment(null); // Close modal
  };

  if (isLoading && !assignments) {
    return <View style={styles.pageContentContainer}><ActivityIndicator size="large" color="#FFFFFF" /><Text style={styles.pageContentText}>Loading Assignments...</Text></View>;
  }

  const allAssignments = assignments ? [...assignments.PastBeforeLastWeek, ...assignments.PastLastWeek, ...assignments.PastThisWeek, ...assignments.Overdue, ...assignments.DueToday, ...assignments.DueTomorrow, ...assignments.DueThisWeek, ...assignments.DueNextWeek, ...assignments.DueAfterNextWeek] : [];

  const today = moment().add(weekOffset, 'weeks');
  const startOfWeek = today.clone().startOf('week');
  const endOfWeek = today.clone().endOf('week');

  const filteredAssignments = allAssignments
    .filter(a => moment(a.DateDue, "M/D/YYYY h:mm A").isBetween(startOfWeek, endOfWeek))
    .sort((a, b) => new Date(a.DateDue) - new Date(b.DateDue));

  return (
    <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
      <AssignmentDetailModal
        postApiInWebView={postApiInWebView}
        visible={!!selectedAssignment}
        assignment={selectedAssignment}
        details={selectedAssignment ? assignmentDetails[selectedAssignment.AssignmentIndexId] : null}
        isLoadingDetails={selectedAssignment && !assignmentDetails[selectedAssignment.AssignmentIndexId]}
        onClose={() => setSelectedAssignment(null)}
        fetchAssignments={fetchAssignments}   // 🔹 Added
        fetchAssignmentDetails={fetchAssignmentDetails} // optional
      />
      <Text style={styles.pageTitle}>Assignment Center</Text>
      <View style={styles.weekNavigator}>
        <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} style={styles.weekNavButton}><Text style={styles.weekNavText}>{'< Prev'}</Text></TouchableOpacity>
        <Text style={styles.weekHeaderText}>{startOfWeek.format('MMM D')} - {endOfWeek.format('MMM D, YYYY')}</Text>
        <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={styles.weekNavButton}><Text style={styles.weekNavText}>{'Next >'}</Text></TouchableOpacity>
      </View>
      <ScrollView
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchAssignments}
            tintColor='#FFFFFF'
          />
        }
      >
        {filteredAssignments.length > 0 ? (
          filteredAssignments.map(item => (
            <AssignmentCard
              key={item.AssignmentIndexId}
              assignment={item}
              onSelect={() => handleSelectAssignment(item)}
            />
          ))
        ) : (
          <Text style={styles.noAssignmentsText}>No assignments due this week.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const AssignmentCard = ({ assignment, onSelect }) => {
  const { status, color } = getStatusInfo(assignment.AssignmentStatusType);
  const cleanHtml = (str) => str?.replace(/<[^>]*>/g, '').replace(/&#160;/g, ' ') || '';
  return (<TouchableOpacity onPress={onSelect} style={styles.assignmentCard}><View style={styles.assignmentHeader}><Text style={styles.assignmentClass} numberOfLines={1}>{assignment.GroupName}</Text><Text style={[styles.assignmentStatus, { color }]}>{status}</Text></View><Text style={styles.assignmentDesc}><FormattedText html={assignment.ShortDescription} /></Text><Text style={styles.assignmentDue}>Due: {moment(assignment.DateDue, "M/D/YYYY h:mm A").format('ddd, MMM D [at] h:mm A')}</Text></TouchableOpacity>);
};

const AssignmentDetailModal = ({
  visible,
  assignment,
  assignmentDetails,
  details,
  isLoadingDetails,
  onClose,
  postApiInWebView,
  fetchAssignments,
  fetchAssignmentDetails,
}) => {
  if (!assignment) return null;

  const [selectedStatus, setSelectedStatus] = useState(-1);
  const [statusInfo, setStatusInfo] = useState(getStatusInfo(-1));
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // ✅ Sync on modal open or assignment data change
  useEffect(() => {
    if (!visible) return;

    const currentStatus =
      typeof assignmentDetails?.AssignmentStatus === "number"
        ? assignmentDetails.AssignmentStatus
        : typeof assignment?.AssignmentStatusType === "number"
          ? assignment.AssignmentStatusType
          : -1;

    setSelectedStatus(currentStatus);
    setStatusInfo(getStatusInfo(currentStatus));
  }, [visible, assignmentDetails, assignment]);

  const cleanHtml = (str) =>
    str?.replace(/<[^>]*>/g, "").replace(/&#160;/g, " ") || "";

  const gradeInfo = details?.AssignmentGrade;
  const maxPoints = details?.MaxPoints;
  const isGraded =
    selectedStatus === 4 || gradeInfo?.HasGrade === 1;

  const handleSaveStatus = () => {
    setShowStatusModal(false);
    setIsUpdating(true);

    // Instantly update the status visually (like the AssignmentCard)
    const newInfo = getStatusInfo(selectedStatus);
    setStatusInfo(newInfo);

    postApiInWebView(
      "https://miamicountryday.myschoolapp.com/api/assignment2/assignmentstatusupdate",
      "ASSIGNMENT_STATUS_UPDATE",
      {
        assignmentIndexId: assignment?.AssignmentIndexId,
        assignmentStatus: selectedStatus,
      }
    );

    // Refresh assignment data after delay
    setTimeout(() => {
      if (fetchAssignments) fetchAssignments();
      if (fetchAssignmentDetails)
        fetchAssignmentDetails(assignment.AssignmentIndexId);
      setIsUpdating(false);
    }, 1000);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <Text style={styles.modalTitle} numberOfLines={2}>
            {assignment.GroupName}
          </Text>

          {/* Title */}
          <Text style={styles.modalSectionTitle}>Title</Text>
          <Text style={styles.modalDescription}>
            {cleanHtml(details?.ShortDescription)}
          </Text>

          {/* Description */}
          <Text style={styles.modalSectionTitle}>Description</Text>
          {isLoadingDetails ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ScrollView style={{ maxHeight: '160' }}>
              <FormattedText
                html={details?.LongDescription || "<i>No Description Provided</i>"}
              />
            </ScrollView>
          )}

          {/* 🔹 Current Status */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle} marginTop={20}>
              Status
            </Text>
            <Text style={[styles.modalStatusText, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
          </View>

          {/* 🔹 Grade Info */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Grade</Text>
            {isLoadingDetails ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : gradeInfo?.HasGrade === 1 ? (
              <View>
                <Text style={styles.modalContentText}>
                  {gradeInfo.Grade || gradeInfo.GradebookGrade}
                  {maxPoints ? ` / ${maxPoints}` : ""}
                </Text>
                {gradeInfo.GradedComment && (
                  <ScrollView style={{ maxHeight: '100' }}>
                    <Text style={styles.modalCommentText}>
                      {cleanHtml(gradeInfo.GradedComment)}
                    </Text>
                  </ScrollView>
                )}
              </View>
            ) : (
              <Text style={styles.modalContentText}>Not Graded</Text>
            )}
          </View>

          {/* 🔹 Button to open popup */}
          <View style={styles.modalSection}>
            <Text style={styles.modalSectionTitle}>Assignment Status</Text>
            <TouchableOpacity
              style={[
                styles.changeStatusButton,
                isGraded && { opacity: 0.5 },
              ]}
              disabled={isGraded}
              onPress={() => !isGraded && setShowStatusModal(true)}
            >
              <Text style={styles.changeStatusText}>
                {isGraded
                  ? "Status locked (graded)"
                  : `Change Status (${statusInfo.status})`}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading indicator */}
          {isUpdating && (
            <Text
              style={{
                color: "#A0A0A0",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              Updating status...
            </Text>
          )}
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🔹 Status selection popup */}
      <Modal visible={showStatusModal} transparent animationType="fade">
        <View style={styles.subModalBackdrop}>
          <View style={styles.subModalContainer}>
            <Text style={styles.subModalTitle}>Change Status</Text>

            {[
              { label: "To Do", value: -1 },
              { label: "In Progress", value: 0 },
              { label: "Complete", value: 1 },
            ].map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={styles.radioRow}
                onPress={() => setSelectedStatus(opt.value)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selectedStatus === opt.value && styles.radioOuterActive,
                  ]}
                >
                  {selectedStatus === opt.value && (
                    <View style={styles.radioInner} />
                  )}
                </View>
                <Text style={styles.radioLabel}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveStatus}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowStatusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const getStatusInfo = (statusType) => {
  switch (statusType) {
    case -1: return { status: 'To Do', color: '#8E8E93' };
    case 0: return { status: 'In Progress', color: '#007AFF' };
    case 1: return { status: 'Complete', color: '#34C759' };
    case 4: return { status: 'Graded', color: '#AF52DE' };
    default: return { status: 'Unknown', color: '#8E8E93' };
  }
};

const MorePage = ({ onOpenChangelog, onNavigate }) => {
  const MenuItem = ({ label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Text style={styles.menuItemText}>{label}</Text>
      <Text style={styles.menuItemArrow}>{'>'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
      <Text style={styles.pageTitle}>More</Text>
      <View style={styles.menuList}>
        <MenuItem label="Messages" onPress={() => onNavigate('Messages')} />
        <MenuItem label="Settings" onPress={() => onNavigate('Settings')} />
        <MenuItem label="Grades" onPress={() => onNavigate('Grades')} />
        <MenuItem label="Classes" onPress={() => onNavigate('Classes')} />
        <MenuItem label="Resources" onPress={() => onNavigate('Resources')} />
        <MenuItem label="Clicker" onPress={() => onNavigate('ClickGame')} />
      </View>
      <TouchableOpacity onLongPress={onOpenChangelog} delayLongPress={2000}>
        <View style={styles.versionInfo}>
          <Text style={styles.versionAppName}>MCDS Mobile</Text>
          <Text style={styles.versionNumber}>Version {APP_VERSION}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const ChangelogPage = ({ onClose }) => (
  <SafeAreaView style={styles.changelogContainer}>
    <View style={styles.changelogHeader}>
      <Text style={styles.pageTitle}>Changelog</Text>
      <TouchableOpacity onPress={onClose}><Text style={styles.closeButtonText}>Back</Text></TouchableOpacity>
    </View>
    <ScrollView contentContainerStyle={styles.changelogContent}>
      {CHANGELOG_DATA.map(log => (
        <View key={log.version} style={styles.changelogVersion}>
          <Text style={styles.changelogVersionTitle}>Version {log.version}</Text>
          {log.changes.map((change, index) => <Text key={index} style={styles.changelogChangeItem}>• {change}</Text>)}
        </View>
      ))}
    </ScrollView>
  </SafeAreaView>
);

const MessagesPage = ({
  messages,
  fetchMessages,
  isLoading,
  onNavigateBack,
  selectedMessage,
  setSelectedMessage,
  postApiInWebView,
  fetchAllMessages,
  fetchApiInWebView,
  allRecipients,
  setAllRecipients,
}) => {
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [pageNumber, setPageNumber] = useState(1);

  // --- Compose modal state ---
  const [isComposing, setIsComposing] = useState(false);
  const [recipientQuery, setRecipientQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const richRef = useRef();

  useEffect(() => {
    fetchMessages(pageNumber);
  }, [pageNumber]);

  const nextPage = () => setPageNumber((prev) => prev + 1);
  const prevPage = () => setPageNumber((prev) => Math.max(1, prev - 1));

  const idsOnPage = (messages || []).map((m) => m?.ConversationId || m?.Id).filter(Boolean);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () =>
    setSelectedIds(
      selectedIds.size === idsOnPage.length ? new Set() : new Set(idsOnPage)
    );

  const clearSelection = () => setSelectedIds(new Set());

  const bulkMarkRead = (ids) => {
    if (!ids?.length) return;
    postApiInWebView(
      'https://miamicountryday.myschoolapp.com/api/message/ConversationBulkUpdate/',
      'MESSAGES_BULK_UPDATE',
      { ids: ids.join(','), markAsRead: true }
    );
    setTimeout(() => {
      clearSelection();
      setSelecting(false);
      fetchMessages(pageNumber);
    }, 800);
  };

  // --- Filter recipients locally ---
  const filteredRecipients = recipientQuery
    ? allRecipients.filter(r =>
      (r.name || '').toLowerCase().includes(recipientQuery.toLowerCase())
    )
    : [];


  // --- Fetch all recipients once ---
  const openComposer = () => {
    Alert.alert("Warning: This feature may have bugs! Be sure to report any to franco.")
    setIsComposing(true);
    if (allRecipients.length === 0) {
      fetchApiInWebView(
        'https://miamicountryday.myschoolapp.com/api/message/getrecipients',
        'FETCH_RECIPIENTS'
      );
    }
  };

  return (
    <View style={styles.pageContentContainer}>
      <BackHeader title="Messages" onBack={onNavigateBack} />

      {/* ─── Top Buttons ─── */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
          marginRight: 10,
        }}
      >
        <TouchableOpacity
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            backgroundColor: '#0A84FF',
            borderRadius: 8,
            marginRight: 10,
          }}
          onPress={openComposer}
        >
          <Text style={{ color: '#FFF', fontWeight: '600' }}>New Message</Text>
        </TouchableOpacity>

        {!selecting ? (
          <TouchableOpacity
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              backgroundColor: '#2C2C2E',
              borderRadius: 8,
            }}
            onPress={() => setSelecting(true)}
          >
            <Text style={{ color: '#FFF', fontWeight: '600' }}>Select</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: '#2C2C2E',
                borderRadius: 8,
              }}
              onPress={() => {
                setSelecting(false);
                clearSelection();
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: '#2C2C2E',
                borderRadius: 8,
              }}
              onPress={selectAll}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>
                {selectedIds.size === idsOnPage.length
                  ? 'Deselect All'
                  : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                backgroundColor: selectedIds.size ? '#0A84FF' : '#0A84FF55',
                borderRadius: 8,
              }}
              disabled={!selectedIds.size}
              onPress={() => bulkMarkRead(Array.from(selectedIds))}
            >
              <Text style={{ color: '#FFF', fontWeight: '600' }}>
                Mark Read ({selectedIds.size})
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* ─── Message List ─── */}
      <ScrollView
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchMessages}
            tintColor="#FFFFFF"
          />
        }
      >
        {isLoading && !messages ? (
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 40 }} />
        ) : messages?.length ? (
          messages.map((msg, index) => {
            const latest = msg.Messages?.[0] || {};
            const conversationId = msg.ConversationId || msg.Id;
            const messageId = latest.Id;
            const sender = latest.FromUser?.UserNameFormatted || 'Unknown';
            const isUnread = latest?.ReadInd === false;
            const subject = msg.Subject || '(No Subject)';
            const preview =
              latest.Body?.replace(/<[^>]+>/g, '')?.slice(0, 120)?.trim() || '';
            const isSelected = selectedIds.has(conversationId);

            return (
              <TouchableOpacity
                key={conversationId || index}
                style={[
                  styles.messageCard,
                  isUnread && {
                    backgroundColor: '#0A84FF22',
                    borderLeftWidth: 3,
                    borderLeftColor: '#0A84FF',
                  },
                  selecting && isSelected && {
                    borderWidth: 2,
                    borderColor: '#0A84FF',
                  },
                ]}
                onPress={() => {
                  if (selecting) {
                    toggleSelect(conversationId);
                    return;
                  }

                  if (isUnread && messageId) {
                    postApiInWebView(
                      'https://miamicountryday.myschoolapp.com/api/message/markread',
                      'MESSAGES_MARK_READ',
                      { messageId }
                    );
                  }
                  setSelectedMessage(msg);
                }}
              >
                {selecting && (
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      borderWidth: 2,
                      borderColor: isSelected ? '#0A84FF' : '#8E8E93',
                      backgroundColor: isSelected ? '#0A84FF' : 'transparent',
                      marginBottom: 6,
                    }}
                  />
                )}
                <Text style={styles.messageSubject}>{subject}</Text>
                <Text style={styles.messageSender}>{sender}</Text>
                <Text style={styles.messagePreview}>{preview}...</Text>
              </TouchableOpacity>
            );
          })
        ) : (
          <Text style={styles.noAssignmentsText}>No messages found.</Text>
        )}
      </ScrollView>

      {!fetchAllMessages && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={prevPage}
            disabled={pageNumber === 1}
            style={[
              styles.paginationButton,
              pageNumber === 1 && styles.paginationButtonDisabled,
            ]}
          >
            <Text style={styles.paginationButtonText}>◀ Prev</Text>
          </TouchableOpacity>
          <Text style={styles.paginationPageText}>Page {pageNumber}</Text>
          <TouchableOpacity
            onPress={nextPage}
            style={[styles.paginationButton, styles.paginationButtonActive]}
          >
            <Text style={styles.paginationButtonText}>Next ▶</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ─── Compose Modal ─── */}
      <Modal
        visible={isComposing}
        animationType="slide"
        onRequestClose={() => setIsComposing(false)}
        transparent
      >
        <TouchableWithoutFeedback
          onPress={() => {
            Keyboard.dismiss();
            richRef.current?.blurContentEditor?.();
          }}
        >
          <View style={styles.composeOverlay}>
            <View style={styles.composeContainer}>
              <ScrollView
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.composeTitle}>Compose Message</Text>

                {/* To Field */}
                <TextInput
                  placeholder="To"
                  placeholderTextColor="#999"
                  style={styles.composeInput}
                  value={recipientQuery}
                  onChangeText={setRecipientQuery}
                />

                {/* Autocomplete dropdown */}
                {filteredRecipients.length > 0 && (
                  <ScrollView style={styles.autocompleteList}>
                    {filteredRecipients.map((r) => (
                      <TouchableOpacity
                        key={r.id}
                        onPress={() => {
                          setSelectedRecipients((prev) =>
                            prev.some((p) => p.id === r.id) ? prev : [...prev, r]
                          );
                          setRecipientQuery('');
                        }}
                      >
                        <Text style={styles.autocompleteItem}>{r.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                {/* Selected recipients */}
                {selectedRecipients.length > 0 && (
                  <View style={styles.selectedRecipients}>
                    {selectedRecipients.map((r) => (
                      <Text key={r.id} style={styles.recipientChip}>
                        {r.name}
                      </Text>
                    ))}
                  </View>
                )}

                {/* Subject */}
                <TextInput
                  placeholder="Subject"
                  placeholderTextColor="#999"
                  style={styles.composeInput}
                  value={subject}
                  onChangeText={setSubject}
                />

                <RichToolbar
                  editor={richRef}
                  actions={[
                    actions.setBold,
                    actions.setItalic,
                    actions.setUnderline,
                    actions.setStrikethrough,
                    actions.insertBulletsList,
                    actions.insertOrderedList,
                    actions.insertLink,
                  ]}
                  style={styles.richToolbar}
                  iconTint="#fff"
                  selectedIconTint="#0A84FF"
                />

                {/* Message editor */}
                <RichEditor
                  ref={richRef}
                  placeholder="Type your message..."
                  initialContentHTML={body}
                  onChange={setBody}
                  editorStyle={{
                    backgroundColor: '#2C2C2E',  // dark background
                    color: '#FFFFFF',             // white text
                    placeholderColor: '#8E8E93',  // subtle gray placeholder
                    contentCSSText: `
                      body {
                        font-family: -apple-system;
                        font-size: 15px;
                        color: #FFFFFF;
                        background-color: #2C2C2E;
                        line-height: 1.5;
                        padding: 10px;
                      }
                      a { color: #0A84FF; text-decoration: underline; }
                      b, strong { color: #FFFFFF; }
                      i, em { color: #D1D1D6; }
                      u { text-decoration: underline; }
                      span[style*="line-through"] { color: #A1A1A1; }
                    `,
                  }}
                  style={{
                    borderRadius: 10,
                    minHeight: 150,
                    maxHeight: 150,
                    marginTop: 8,
                  }}
                />

                {/* Action buttons */}
                <View style={styles.composeActions}>
                  <TouchableOpacity
                    onPress={() => setIsComposing(false)}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      const participants = selectedRecipients.map((r) => ({
                        AssociationId: String(r.associationId),
                        Pk: String(r.userId),
                        MembersToInclude: '0',
                        Name: r.name,
                      }));
                      const payload = {
                        Participants: participants,
                        Messages: [{ Body: body, Status: 2, FromSelf: false }],
                        ReplyToAll: false,
                        Subject: subject,
                        ParticipantList: participants.map((p) => p.Name).join(', '),
                      };
                      postApiInWebView(
                        'https://miamicountryday.myschoolapp.com/api/message/conversation/?format=json',
                        'SEND_MESSAGE',
                        payload
                      );
                      setIsComposing(false);
                      setSubject('');
                      setBody('');
                      setSelectedRecipients([]);
                      fetchMessages();
                    }}
                    style={styles.sendButton}
                  >
                    <Text style={styles.sendButtonText}>Send</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <MessageDetailModal
        visible={!!selectedMessage}
        message={selectedMessage}
        onClose={() => setSelectedMessage(null)}
      />
    </View>
  );
};


const ClickGamePage = ({ onNavigateBack, userInfo }) => {
  const [score, setScore] = useState(0);
  const [floaters, setFloaters] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopVisible, setShopVisible] = useState(false);
  const [clickMultiplier, setClickMultiplier] = useState(1);
  const [devPanelVisible, setDevPanelVisible] = useState(false);
  const [devMultiplier, setDevMultiplier] = useState('');
  const [devScore, setDevScore] = useState('');
  const [devLeaderboardEdit, setDevLeaderboardEdit] = useState({ name: '', clicks: '' });
  const animScale = useRef(new Animated.Value(1)).current;
  const floaterId = useRef(0);
  const [cps, setCps] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const clickTimestamps = useRef([]);
  const highCpsDuration = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // keep only last 1 second of clicks
      clickTimestamps.current = clickTimestamps.current.filter(ts => now - ts < 1000);
      const currentCps = clickTimestamps.current.length;
      setCps(currentCps);

      // --- Anti-cheat logic ---
      if (currentCps > 20) {
        highCpsDuration.current += 0.25; // interval runs every 250 ms
        if (highCpsDuration.current >= 5 && !warningShown) {
          Alert.alert(
            '⚠️ High CPS Detected',
            'Your clicking speed exceeded 20 CPS for over 5 seconds.\nContinued activity may result in a ban.',
            [{ text: 'OK', style: 'default' }]
          );
          setWarningShown(true);
        }
      } else {
        highCpsDuration.current = 0; // reset if CPS drops
      }
    }, 250);

    return () => clearInterval(interval);
  }, [warningShown]);

  // --- Tips ---
  const [tipText, setTipText] = useState('');
  const tipIndex = useRef(0);
  const typingTimeout = useRef(null);
  const tipList = [
    "Tip: If you click the big blue circle you get a dopamine hit to your brain",
    "Tip: Rebirths reset your clicks but multiply clicks x2",
    "Tip: You should beat the top score",
    "Tip: Click faster!",
    "Tip: 6-7",
    "Tip: If you jump in real life you get clicks",
    "Tip: Offline progress saves automatically now",
    "Tip: He is behind you...",
    "Tip: Did you know there is a secret page in the app?",
    "Tip: Try not to force quit the app very quickly, bugs may occur.",
  ];

  const typeWriter = (text, i = 0) => {
    if (i <= text.length) {
      setTipText(text.substring(0, i));
      typingTimeout.current = setTimeout(() => typeWriter(text, i + 1), 40);
    }
  };

  useEffect(() => {
    const showNextTip = () => {
      clearTimeout(typingTimeout.current);
      const current = tipList[tipIndex.current];
      typeWriter(current);
      tipIndex.current = (tipIndex.current + 1) % tipList.length;
    };
    showNextTip();
    const interval = setInterval(showNextTip, 10000);
    return () => {
      clearInterval(interval);
      clearTimeout(typingTimeout.current);
    };
  }, []);

  // --- Game constants ---
  const nameKey = `${userInfo.FirstName} ${userInfo.LastName.charAt(0)}.`;
  const formatNumber = (num) => num.toLocaleString();
  const rebirthStages = [
    { cost: 150000, multiplier: 2 },
    { cost: 375000, multiplier: 4 },
    { cost: 600000, multiplier: 8 },
    { cost: 1000000, multiplier: 16 },
  ];

  const getNextRebirth = () => rebirthStages.find((s) => s.multiplier > clickMultiplier) || null;

  // --- Save management ---
  const scoreRef = useRef(0);
  const lastSavedRef = useRef(-1);
  const saveTimerRef = useRef(null);

  const saveScoreToFirestore = async (value) => {
    try {
      await setDoc(doc(db, 'clickgame', nameKey), { name: nameKey, clicks: value });
      lastSavedRef.current = value;
    } catch (e) {
      console.error('Error saving score:', e);
    }
  };

  const flushScoreNow = async (value) => {
    await AsyncStorage.setItem(`clickgame_${nameKey}`, String(value));
    await saveScoreToFirestore(value);
  };

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // --- Timed Firestore save every 5s ---
  useEffect(() => {
    saveTimerRef.current = setInterval(async () => {
      const value = scoreRef.current;
      if (value !== lastSavedRef.current) {
        await AsyncStorage.setItem(`clickgame_${nameKey}`, String(value));
        await saveScoreToFirestore(value);
      }
    }, 5000);

    return () => {
      clearInterval(saveTimerRef.current);
      const finalValue = scoreRef.current;
      AsyncStorage.setItem(`clickgame_${nameKey}`, String(finalValue));
      saveScoreToFirestore(finalValue);
    };
  }, []);

  // --- Load data ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedScore = await AsyncStorage.getItem(`clickgame_${nameKey}`);
        if (storedScore !== null) setScore(parseInt(storedScore));

        const storedMultiplier = await AsyncStorage.getItem(`clickgame_multiplier_${nameKey}`);
        if (storedMultiplier) setClickMultiplier(parseInt(storedMultiplier));
        else {
          await AsyncStorage.setItem(`clickgame_multiplier_${nameKey}`, '1');
          setClickMultiplier(1);
        }

        const docRef = doc(db, 'clickgame', nameKey);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setScore(data.clicks || 0);
          await AsyncStorage.setItem(`clickgame_${nameKey}`, String(data.clicks || 0));
        } else {
          await setDoc(docRef, { name: nameKey, clicks: 0 });
          await AsyncStorage.setItem(`clickgame_${nameKey}`, '0');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // --- Leaderboard ---
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'clickgame'), orderBy('clicks', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => doc.data());
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  // --- Click handler ---
  const handleClick = async () => {
    clickTimestamps.current.push(Date.now());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(animScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(animScale, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();

    setScore((prev) => {
      const newScore = prev + clickMultiplier;
      AsyncStorage.setItem(`clickgame_${nameKey}`, String(newScore)); // instant local save
      return newScore;
    });

    addFloater();
  };

  // --- Floating +X ---
  const addFloater = () => {
    const id = floaterId.current++;
    const moveAnim = new Animated.Value(0);
    const opacityAnim = new Animated.Value(1);
    const maxX = 175, minX = -175, maxY = 175, minY = -175;
    const xOffset = Math.random() * (maxX - minX) + minX;
    const yOffset = Math.random() * (maxY - minY) + minY;

    setFloaters((prev) => [...prev, { id, moveAnim, opacityAnim, xOffset, yOffset }]);
    Animated.parallel([
      Animated.timing(moveAnim, { toValue: -60, duration: 1000, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
    ]).start(() => setFloaters((prev) => prev.filter((f) => f.id !== id)));
  };

  // --- Rebirth ---
  const handleRebirth = async () => {
    const nextStage = getNextRebirth();
    if (!nextStage) {
      Alert.alert('Maxed Out!', 'You’ve reached the final 16× stage!');
      return;
    }

    if (score >= nextStage.cost) {
      const newMultiplier = nextStage.multiplier;
      await AsyncStorage.setItem(`clickgame_multiplier_${nameKey}`, String(newMultiplier));
      await flushScoreNow(0);
      setClickMultiplier(newMultiplier);
      setScore(0);
      Alert.alert('Rebirth Complete!', `Click value increased to x${newMultiplier}`);
      setShopVisible(false);
    } else {
      Alert.alert('Not Enough Clicks', `You need ${formatNumber(nextStage.cost)} clicks to rebirth!`);
    }
  };

  const nextStage = getNextRebirth();

  return (
    <View style={[styles.pageContentContainer, { alignItems: 'center' }]}>
      <View style={styles.clickerHeader}>
        <TouchableOpacity onPress={onNavigateBack} style={styles.backButtonInline}>
          <Text style={styles.backArrow}>{'‹ Back'}</Text>
        </TouchableOpacity>
        <Text style={styles.clickerTitle}>Clicker</Text>
        <TouchableOpacity onPress={() => setShopVisible(true)} style={styles.shopButton}>
          <SvgXml xml={shopIconXml} width={26} height={26} />
        </TouchableOpacity>
      </View>

      {/* <Text style={{ color: '#B0B0B0', fontSize: 16, marginVertical: 10, textAlign: 'center' }}>
        {tipText}
      </Text> */}

      <Animated.View style={[styles.clickCircleContainer, { transform: [{ scale: animScale }] }]}>
        <TouchableOpacity
          onPress={handleClick}
          onLongPress={() => nameKey === 'Franco B.' && setDevPanelVisible(true)}
          delayLongPress={2000}
          style={styles.clickButton}
        />
      </Animated.View>

      {/* Floating +Xs */}
      {floaters.map((f) => (
        <Animated.Text
          key={f.id}
          style={{
            position: 'absolute',
            color: '#FFFFFF',
            fontSize: 22,
            fontWeight: 'bold',
            opacity: f.opacityAnim,
            transform: [
              { translateY: f.moveAnim },
              { translateX: f.xOffset },
              { translateY: f.yOffset + 200 },
            ],
          }}
        >
          +{clickMultiplier}
        </Animated.Text>
      ))}

      <Text style={styles.clickScore}>{formatNumber(score)}</Text>
      <Text style={{ color: '#8E8E93', fontSize: 16, marginTop: 6 }}>Multiplier: x{clickMultiplier}</Text>
      <Text style={{ color: '#8E8E93', fontSize: 16, marginTop: 4 }}> CPS: {cps.toFixed(1)} </Text>


      <Text style={[styles.pageTitle, { fontSize: 24, marginTop: 30 }]}>Leaderboard</Text>
      {loading ? (
        <ActivityIndicator color="#FFFFFF" size="large" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={{ width: '100%' }}>
          {leaderboard.map((entry, index) => (
            <View key={index} style={styles.leaderboardRow}>
              <Text style={styles.leaderboardRank}>{index + 1}.</Text>
              <Text style={styles.leaderboardName}>{entry.name}</Text>
              <Text style={styles.leaderboardScore}>{formatNumber(entry.clicks)}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Shop */}
      <Modal visible={shopVisible} animationType="fade" transparent={true} onRequestClose={() => setShopVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.shopContainer}>
            <Text style={styles.shopTitle}>Shop</Text>
            <Text style={styles.shopSubtitle}>Rebirth to increase your click multiplier</Text>
            {nextStage ? (
              <TouchableOpacity
                style={[styles.upgradeButton, score < nextStage.cost && { opacity: 0.5 }]}
                onPress={handleRebirth}
              >
                <Text style={styles.upgradeText}>
                  ♾️ Rebirth for {formatNumber(nextStage.cost)} → x{nextStage.multiplier}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={{ color: '#8E8E93', fontSize: 16, marginVertical: 10 }}>You’ve reached the max rebirth!</Text>
            )}
            <TouchableOpacity onPress={() => setShopVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Dev Panel */}
      <Modal visible={devPanelVisible} animationType="fade" transparent={true} onRequestClose={() => setDevPanelVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.shopContainer}>
            <Text style={styles.shopTitle}>Developer Panel</Text>

            <Text style={styles.shopSubtitle}>Set Click Multiplier</Text>
            <TextInput
              value={devMultiplier}
              onChangeText={setDevMultiplier}
              keyboardType="numeric"
              placeholder={`Current: ${clickMultiplier}`}
              placeholderTextColor="#888"
              style={styles.devInput}
            />
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={async () => {
                const newVal = parseInt(devMultiplier);
                if (!isNaN(newVal)) {
                  setClickMultiplier(newVal);
                  await AsyncStorage.setItem(`clickgame_multiplier_${nameKey}`, String(newVal));
                  Alert.alert('Multiplier updated!', `Now x${newVal}`);
                }
              }}
            >
              <Text style={styles.upgradeText}>Apply Multiplier</Text>
            </TouchableOpacity>

            <Text style={styles.shopSubtitle}>Set Your Score</Text>
            <TextInput
              value={devScore}
              onChangeText={setDevScore}
              keyboardType="numeric"
              placeholder={`Current: ${score}`}
              placeholderTextColor="#888"
              style={styles.devInput}
            />
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={async () => {
                const newScore = parseInt(devScore);
                if (!isNaN(newScore)) {
                  setScore(newScore);
                  await flushScoreNow(newScore);
                  fetchLeaderboard();
                  Alert.alert('Score updated!', `Now ${newScore.toLocaleString()} clicks`);
                }
              }}
            >
              <Text style={styles.upgradeText}>Apply Score</Text>
            </TouchableOpacity>

            <Text style={styles.shopSubtitle}>Edit Leaderboard Entry</Text>
            <TextInput
              value={devLeaderboardEdit.name}
              onChangeText={(t) => setDevLeaderboardEdit({ ...devLeaderboardEdit, name: t })}
              placeholder="Name (e.g. Franco B.)"
              placeholderTextColor="#888"
              style={styles.devInput}
            />
            <TextInput
              value={devLeaderboardEdit.clicks}
              onChangeText={(t) => setDevLeaderboardEdit({ ...devLeaderboardEdit, clicks: t })}
              keyboardType="numeric"
              placeholder="New Clicks"
              placeholderTextColor="#888"
              style={styles.devInput}
            />
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={async () => {
                const { name, clicks } = devLeaderboardEdit;
                if (name && clicks) {
                  await setDoc(doc(db, 'clickgame', name), { name, clicks: parseInt(clicks) });
                  fetchLeaderboard();
                  Alert.alert('Leaderboard updated!', `${name}: ${parseInt(clicks).toLocaleString()} clicks`);
                }
              }}
            >
              <Text style={styles.upgradeText}>Apply Leaderboard Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setDevPanelVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const MessageDetailModal = ({ visible, message, onClose }) => {
  if (!message) return null;
  const latest = message.Messages[0];
  const sender = latest.FromUser?.UserNameFormatted || 'Unknown';
  const photoUrl = `${BASE_URL}${latest.FromUser?.ProfilePhoto?.LargeFilenameEditedUrl}`;
  const sendDate = latest.SendDate;
  const msgId = latest.MessageId;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.messageDetailsSafeArea}>
        <View style={styles.gradeDetailsHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.gradeDetailsCloseButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.gradeDetailsTitle}>Message</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.gradeDetailsScroll}>
          <View style={styles.messageHeader}>
            <Image
              source={{ uri: photoUrl }}
              style={styles.messageAvatar}
            />
            <View>
              <Text style={styles.messageSenderFull}>{sender}</Text>
              <Text style={styles.messageDate}>{sendDate}</Text>
            </View>
          </View>

          <Text style={styles.messageSubjectFull}>{message.Subject}</Text>
          <FormattedText html={latest.Body} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const GradesPage = ({ userInfo, grades, fetchGrades, fetchGradeDetails, isLoading, onNavigateBack }) => {
  useEffect(() => {
    if (!grades) fetchGrades();
  }, []);

  // --- GPA Calculator ---
  const calculateGPA = () => {
    if (!grades || grades.length === 0) return { weighted: 0, unweighted: 0 };

    let totalWeighted = 0;
    let totalUnweighted = 0;
    let count = 0;

    grades.forEach(course => {
      const grade = parseFloat(course.cumgrade);
      if (isNaN(grade)) return;

      const isHonors = course.sectionidentifier?.includes('- H');
      const isAP = course.sectionidentifier?.includes('- AP');

      // accurate GPA scale
      let gpaCP = 0, gpaHonors = 0, gpaAP = 0;

      if (grade >= 97) [gpaCP, gpaHonors, gpaAP] = [4.3, 4.8, 5.3];
      else if (grade >= 93) [gpaCP, gpaHonors, gpaAP] = [4.0, 4.5, 5.0];
      else if (grade >= 90) [gpaCP, gpaHonors, gpaAP] = [3.7, 4.2, 4.7];
      else if (grade >= 87) [gpaCP, gpaHonors, gpaAP] = [3.3, 3.8, 4.3];
      else if (grade >= 83) [gpaCP, gpaHonors, gpaAP] = [3.0, 3.5, 4.0];
      else if (grade >= 80) [gpaCP, gpaHonors, gpaAP] = [2.7, 3.2, 3.7];
      else if (grade >= 77) [gpaCP, gpaHonors, gpaAP] = [2.3, 2.8, 3.3];
      else if (grade >= 73) [gpaCP, gpaHonors, gpaAP] = [2.0, 2.5, 3.0];
      else if (grade >= 70) [gpaCP, gpaHonors, gpaAP] = [1.7, 2.2, 2.7];
      else if (grade >= 67) [gpaCP, gpaHonors, gpaAP] = [1.3, 1.8, 2.3];
      else if (grade >= 63) [gpaCP, gpaHonors, gpaAP] = [1.0, 1.5, 2.0];
      else if (grade >= 60) [gpaCP, gpaHonors, gpaAP] = [0.7, 1.2, 1.7];
      else[gpaCP, gpaHonors, gpaAP] = [0, 0, 0];

      totalUnweighted += gpaCP;

      let weightedGPA = gpaCP;
      if (isHonors) weightedGPA = gpaHonors;
      if (isAP) weightedGPA = gpaAP;

      totalWeighted += weightedGPA;
      count++;
    });

    return {
      weighted: (totalWeighted / count).toFixed(2),
      unweighted: (totalUnweighted / count).toFixed(2),
    };
  };


  const { weighted, unweighted } = calculateGPA();

  const reloadGrades = () => {
    calculateGPA();
    fetchGrades();
  };

  // --- Render ---
  return (
    <View style={styles.pageContentContainer}>
      <BackHeader title="Grades" onBack={onNavigateBack} />

      {/* GPA Summary */}
      {grades && grades.length > 0 && (
        <View style={styles.gpaContainer}>
          <View style={styles.gpaBox}>
            <Text style={styles.gpaLabel}>Weighted GPA</Text>
            <Text style={styles.gpaValue}>{weighted}</Text>
          </View>
          <View style={styles.gpaBox}>
            <Text style={styles.gpaLabel}>Unweighted GPA</Text>
            <Text style={styles.gpaValue}>{unweighted}</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={{ width: '100%' }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => reloadGrades()}
            tintColor="#FFFFFF"
          />
        }
      >
        {isLoading && !grades ? (
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 40 }} />
        ) : grades && grades.length > 0 ? (
          grades.map((course, index) => (
            <TouchableOpacity
              key={index}
              style={styles.gradeCard}
              onPress={() => fetchGradeDetails(course.sectionid, course.markingperiodid, userInfo.UserId)}
            >
              <View style={styles.gradeHeader}>
                <Text style={styles.gradeTitle}>{course.sectionidentifier}</Text>
                <Text style={styles.gradeValue}>{course.cumgrade ? `${course.cumgrade}%` : 'N/A'}</Text>
              </View>
              <Text style={styles.gradeSubText}>{course.groupownername}</Text>
              <Text style={styles.gradeSubText}>{course.room || 'No Room Assigned'}</Text>
              <Text style={styles.gradeSubText}>{course.currentterm}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noAssignmentsText}>No grades available.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const GradeDetailsModal = ({ visible, details, onClose }) => {
  const [expandedType, setExpandedType] = useState(null);
  if (!details || details.length === 0) return null;

  const grouped = details.reduce((acc, a) => {
    const type = a.AssignmentType || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(a);
    return acc;
  }, {});

  const toggleExpand = (type) => setExpandedType(expandedType === type ? null : type);
  const cleanHtml = (str) => str?.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ') || '';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.gradeDetailsSafeArea}>
        <View style={styles.gradeDetailsHeader}>
          <TouchableOpacity onPress={onClose}><Text style={styles.gradeDetailsCloseButton}>Close</Text></TouchableOpacity>
          <Text style={styles.gradeDetailsTitle}>Grade Details</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView contentContainerStyle={styles.gradeDetailsScroll}>
          {Object.entries(grouped).map(([type, items]) => {
            const totalEarned = items.reduce((sum, a) => sum + (a.TotalPoints || 0), 0);
            const totalMax = items.reduce((sum, a) => sum + (a.TotalMaxPoints || 0), 0);
            const percentage = totalMax ? ((totalEarned / totalMax) * 100).toFixed(1) : 0;

            return (
              <View key={type} style={styles.gradeGroupContainer}>
                <TouchableOpacity onPress={() => toggleExpand(type)}>
                  <View style={styles.gradeGroupHeader}>
                    <Text style={styles.gradeGroupTitle}>{type}</Text>
                    <Text style={styles.gradeGroupPercent}>{percentage}%</Text>
                  </View>
                  <Text style={styles.gradeGroupInfo}>{items.length} total — {totalEarned} / {totalMax} points</Text>
                </TouchableOpacity>
                {expandedType === type && (
                  <View style={styles.gradeAssignmentsList}>
                    {items.map((a) => (
                      <View key={a.AssignmentId} style={styles.assignmentRow}>
                        <View style={styles.assignmentRowHeader}>
                          <Text style={styles.assignmentRowTitle}>{a.AssignmentShortDescription || 'Untitled'}</Text>
                          <Text style={styles.assignmentRowScore}>{a.Points}/{a.MaxPoints}</Text>
                        </View>
                        {a.Comment ? <FormattedText html={a.Comment} /> : null}
                        <View style={styles.assignmentDivider} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const SettingsPage = ({ onNavigateBack, backgroundUri, blurAmount, setBackgroundUri, setFetchAllMessages, fetchAllMessages, setBlurAmount }) => {
  const [localBackgroundUri, setLocalBackgroundUri] = useState(null);
  const [localBlurAmount, setLocalBlurAmount] = useState(0);

  const onToggleFetchAll = async (value) => {
    try {
      setFetchAllMessages(value);                 // <- updates UI immediately
      await AsyncStorage.setItem('fetchAllMessages', String(value)); // persist
    } catch { }
  };

  useEffect(() => {
    (async () => {
      const savedBg = await AsyncStorage.getItem('userBackground');
      const savedBlur = await AsyncStorage.getItem('userBlur');
      if (savedBg) setBackgroundUri(savedBg);
      if (savedBlur) setBlurAmount(parseFloat(savedBlur));
    })();
  }, []);

  const pickBackground = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Please allow photo access to choose a background.');
      return;
    }

    // Step 1: Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false, // user can pick first without cropping
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled) {
      const selectedUri = result.assets[0].uri;

      // Step 2: Ask if they want to crop it
      Alert.alert(
        'Edit Image?',
        'Would you like to crop or resize the image before using it as a background?',
        [
          {
            text: 'Crop',
            onPress: async () => {
              const cropped = await ImageManipulator.manipulateAsync(
                selectedUri,
                [],
                { compress: 1, format: ImageManipulator.SaveFormat.PNG }
              );
              setBackgroundUri(cropped.uri);
              await AsyncStorage.setItem('userBackground', cropped.uri);
            },
          },
          {
            text: 'Use as is',
            onPress: async () => {
              setBackgroundUri(selectedUri);
              await AsyncStorage.setItem('userBackground', selectedUri);
            },
            style: 'default',
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  const handleBlurChange = async (val) => {
    setBlurAmount(val);
    await AsyncStorage.setItem('userBlur', val.toString());
  };

  const resetBackground = async () => {
    setBackgroundUri(null);
    setBlurAmount(0);
    await AsyncStorage.removeItem('userBackground');
    await AsyncStorage.removeItem('userBlur');
  };

  return (
    <View style={styles.pageContentContainer}>
      <BackHeader title="Settings" onBack={onNavigateBack} />

      <ScrollView style={{ width: '100%' }}>
        <Text style={styles.settingsCardTitle}>Background</Text>

        <View style={styles.settingsCard}>
          <Text style={styles.settingsCardSubtitle}>Choose a custom background image</Text>

          {backgroundUri ? (
            <Image source={{ uri: backgroundUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Text style={styles.placeholderText}>No background set</Text>
            </View>
          )}
          <TouchableOpacity onPress={pickBackground} style={[styles.upgradeButton, { marginTop: 10 }]}>
            <Text style={styles.upgradeText}>Pick Background</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetBackground} style={[styles.upgradeButton, { marginTop: 10 }]}>
            <Text style={styles.upgradeText}>Reset Background</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsCard}>
          <Text style={styles.backHeaderTitle}>Background Blur</Text>
          <Slider
            minimumValue={0}
            maximumValue={20}
            step={1}
            value={blurAmount}
            onValueChange={handleBlurChange}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#3A3A3C"
            thumbTintColor="#007AFF"
          />
          <Text style={styles.blurLabel}>Blur: {blurAmount}</Text>
        </View>

        <Text style={styles.settingsCardTitle}>Expiremental</Text>
        <View style={styles.settingsCard} pointerEvents="auto">
          <Text style={styles.settingsCardSubtitle}>Fetch all messages at once</Text>
          <Switch
            value={fetchAllMessages}
            onValueChange={async (val) => {
              if (val) {
                Alert.alert(
                  'Warning',
                  'Fetching all messages at once may take longer to load and use more data, but it can be usefull for marking large amounts as read and more.',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => { }, // do nothing, don’t toggle
                    },
                    {
                      text: 'Continue',
                      style: 'default',
                      onPress: async () => {
                        setFetchAllMessages(true);
                        await AsyncStorage.setItem('fetchAllMessages', 'true');
                      },
                    },
                  ]
                );
              } else {
                setFetchAllMessages(false);
                await AsyncStorage.setItem('fetchAllMessages', 'false');
              }
            }}
            trackColor={{ false: '#2C2C2E', true: '#0A84FF' }}
            thumbColor="#FFF"
          />
        </View>
      </ScrollView>
    </View>
  );
};


const ResourcesPage = ({ onNavigateBack }) => {
  const handleOpenLink = (url) => { Linking.openURL(url).catch(err => console.error("Couldn't load page", err)); };
  const ResourceItem = ({ label, url }) => (
    <TouchableOpacity style={styles.menuItem} onPress={() => handleOpenLink(url)}>
      <Text style={styles.menuItemText}>{label}</Text>
      <Text style={styles.menuItemArrow}>{'>'}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
      <BackHeader title="Resources" onBack={onNavigateBack} />
      <View style={styles.menuList}>
        <ResourceItem label="Announcements" url="https://www.canva.com/design/DAGOf_CuuSg/Lp8cITfl7i2Rfe4ehxPkwg/edit" />
        <ResourceItem label="Lunch Menu" url="https://www.sagedining.com/sites/miamicountryday/menu" />
        <ResourceItem label="The Spartacus" url="https://www.thespartacus.com" />
      </View>
    </View>
  );
};

const PlaceholderPage = ({ title, onNavigateBack }) => <View style={[styles.pageContentContainer, styles.placeholderAlignment]}><BackHeader title={title} onBack={onNavigateBack} /><Text style={styles.pageContentText}>This feature is coming soon.</Text></View>;
const BottomNavBar = ({ activePage, onNavigate }) => {
  const Icon = ({ xml, color }) => <SvgXml xml={xml} width="28" height="28" fill={color} />;
  const NavButton = ({ name, iconXml }) => {
    const isActive = activePage === name;
    const color = isActive ? '#007AFF' : '#8E8E93';
    return (<TouchableOpacity onPress={() => onNavigate(name)} style={styles.navButton}><Icon xml={iconXml} color={color} /><Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{name}</Text></TouchableOpacity>);
  };
  return (<View style={styles.navBar}><NavButton name="Home" iconXml={homeIconXml} /><NavButton name="Assignments" iconXml={assignmentsIconXml} /><NavButton name="Schedule" iconXml={scheduleIconXml} /><NavButton name="More" iconXml={menuIconXml} /></View>);
};

// --- Styles ---
const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#1C1C1E' }, // Main wrapper for the app
  webviewVisible: { flex: 1, backgroundColor: '#FFFFFF' },
  webviewHidden: { position: 'absolute', top: -10000, left: 0, width: 0, height: 0, zIndex: -1 },
  loadingOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.7)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, zIndex: 10, },
  loadingText: { color: '#FFFFFF', marginLeft: 10, fontSize: 16 },
  loginHeader: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  loginTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1C1C1E' },
  appHeader: { marginTop: -30, paddingHorizontal: 20 },
  appTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#D32F2F', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  pageContentContainer: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  placeholderAlignment: { justifyContent: 'flex-start' },
  pageTitle: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, alignSelf: 'flex-start' },
  pageContentText: { fontSize: 16, color: '#A0A0A0', marginTop: 10, textAlign: 'center' },
  greeting: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 30, },
  profileImage: { width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#007AFF', marginBottom: 20, backgroundColor: '#3A3A3C' },
  profileImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  profileImagePlaceholderText: { color: '#FFFFFF', fontSize: 72, fontWeight: 'bold' },
  navBar: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderTopWidth: 1, borderTopColor: '#3A3A3C', paddingTop: 10 },
  navButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  navLabelActive: { color: '#007AFF' },
  menuList: { width: '100%', flex: 1 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#3A3A3C', width: '100%', },
  menuItemText: { color: '#FFFFFF', fontSize: 18 },
  menuItemArrow: { color: '#8E8E93', fontSize: 18, fontWeight: 'bold' },
  versionInfo: { alignItems: 'center', paddingVertical: 30 },
  versionAppName: { color: '#A0A0A0', fontSize: 16, fontWeight: '600' },
  versionNumber: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  dateNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10, marginBottom: 10 },
  dateNavButton: { padding: 10 },
  dateNavText: { color: '#007AFF', fontSize: 16 },
  dateHeaderText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  scheduleCard: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 12, marginBottom: 10, width: '100%', overflow: 'hidden' },
  scheduleColorBar: { width: 6 },
  scheduleTime: { padding: 15, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#3A3A3C' },
  scheduleTimeText: { color: '#E5E5EA', fontSize: 14 },
  scheduleDetails: { flex: 1, padding: 15 },
  scheduleCourseTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  scheduleSubText: { color: '#8E8E93', fontSize: 14 },
  scheduleBlock: { padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A3C' },
  scheduleBlockText: { color: '#FFFFFF', fontSize: 13, fontWeight: 'bold' },
  weekNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10, marginBottom: 10 },
  weekNavButton: { padding: 10 },
  weekNavText: { color: '#007AFF', fontSize: 16 },
  weekHeaderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  assignmentCard: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%' },
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  assignmentClass: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10 },
  assignmentStatus: { fontSize: 12, fontWeight: '700' },
  assignmentDesc: { color: '#E5E5EA', fontSize: 15, marginBottom: 12 },
  assignmentDue: { color: '#8E8E93', fontSize: 12 },
  changeStatusButton: { backgroundColor: '#1C1C1E', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#3A3A3C' },
  changeStatusText: { color: '#FFFFFF', fontSize: 16, textAlign: 'center' },
  subModalBackdrop: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  subModalContainer: { backgroundColor: '#2C2C2E', padding: 20, borderRadius: 16, width: '85%', alignItems: 'stretch' },
  subModalTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 15, textAlign: 'center' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6 },
  radioOuter: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#A0A0A0', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  radioOuterActive: { borderColor: '#007AFF' },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#007AFF' },
  radioLabel: { color: '#FFFFFF', fontSize: 16 },
  modalButtonRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20 },
  saveButton: { backgroundColor: '#007AFF', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  saveButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  cancelButton: { backgroundColor: '#3A3A3C', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8 },
  cancelButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
  noAssignmentsText: { color: '#8E8E93', textAlign: 'center', marginTop: 40, fontSize: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { backgroundColor: '#2C2C2E', borderRadius: 14, padding: 20, width: '90%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  modalDescription: { color: '#E5E5EA', fontSize: 16, marginBottom: 20 },
  modalSection: { marginBottom: 20 },
  modalSectionTitle: { color: '#8E8E93', fontSize: 14, fontWeight: '600', marginBottom: 8 },
  modalContentText: { color: '#FFFFFF', fontSize: 16 },
  modalStatusText: { fontSize: 16, fontWeight: 'bold' },
  modalCommentText: { color: '#8E8E93', fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  closeButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  closeButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' },
  // Changelog styles
  changelogContainer: { flex: 1, backgroundColor: '#1C1C1E' },
  changelogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 60, backgroundColor: '#1C1C1E' },
  changelogContent: { paddingHorizontal: 20 },
  changelogVersion: { marginBottom: 25 },
  changelogVersionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  changelogChangeItem: { color: '#E5E5EA', fontSize: 16, marginBottom: 5, paddingLeft: 10, lineHeight: 22 },
  emailRow: { width: '100%', alignItems: 'center', marginTop: 10 },
  emailTouchable: { alignItems: 'center', justifyContent: 'center' },
  emailInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  emailText: { fontSize: 16, color: '#A0A0A0', textAlign: 'center', marginRight: 5, marginLeft: 10 },
  copyIcon: { tintColor: '#A0A0A0', marginLeft: 2 },
  gradeCard: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%' },
  gradeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  gradeTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10 },
  gradeValue: { color: '#34C759', fontSize: 18, fontWeight: 'bold' },
  gradeSubText: { color: '#8E8E93', fontSize: 14 },
  gpaContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  gpaBox: { flex: 1, backgroundColor: '#2C2C2E', padding: 15, borderRadius: 12, marginHorizontal: 5, alignItems: 'center' },
  gpaLabel: { color: '#8E8E93', fontSize: 14, fontWeight: '600', marginBottom: 6 },
  gpaValue: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  gradeDetailsSafeArea: { flex: 1, backgroundColor: '#1C1C1E', paddingTop: 55 },
  gradeDetailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  gradeDetailsTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', flex: 1 },
  gradeDetailsCloseButton: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  gradeDetailsScroll: { padding: 20 },
  gradeGroupContainer: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15 },
  gradeGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gradeGroupTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
  gradeGroupPercent: { color: '#34C759', fontSize: 16, fontWeight: 'bold' },
  gradeGroupInfo: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  gradeAssignmentsList: { marginTop: 10 },
  assignmentRow: { marginBottom: 10 },
  assignmentRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 3 },
  assignmentRowTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', flex: 1, marginRight: 10 },
  assignmentRowScore: { color: '#34C759', fontSize: 15, fontWeight: 'bold' },
  assignmentRowDesc: { color: '#E5E5EA', fontSize: 14, marginTop: 4 },
  assignmentRowComment: { color: '#8E8E93', fontSize: 13, fontStyle: 'italic', marginTop: 4 },
  assignmentDivider: { height: 1, backgroundColor: '#3A3A3C', marginTop: 8 },
  backHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 20 },
  backButton: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  backArrow: { color: '#007AFF', fontSize: 18, fontWeight: '600' },
  backText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  backHeaderTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', textAlign: 'center', flex: 1 },
  skipButton: { position: 'absolute', right: 10, top: 10, padding: 15 },
  skipText: { color: '#007AFF', fontSize: 16, fontWeight: '600' },
  messageDetailsSafeArea: { flex: 1, backgroundColor: '#1C1C1E', paddingTop: 5 },
  messageCard: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%', },
  messageSubject: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  messageSender: { color: '#8E8E93', fontSize: 14, marginTop: 4 },
  messagePreview: { color: '#E5E5EA', fontSize: 14, marginTop: 6 },
  messageHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  messageAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12, backgroundColor: '#3A3A3C' },
  messageSenderFull: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  messageDate: { color: '#8E8E93', fontSize: 13 },
  messageSubjectFull: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  paginationContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#2C2C2E', gap: 12 },
  paginationButton: { backgroundColor: '#2C2C2E', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  paginationButtonActive: { backgroundColor: '#2C2C2E55' },
  paginationButtonDisabled: { backgroundColor: '#2C2C2E55' },
  paginationButtonText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  paginationPageText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  composeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  composeContainer: { backgroundColor: '#1C1C1E', borderRadius: 16, width: '92%', padding: 16 },
  composeTitle: { color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 10 },
  composeInput: { backgroundColor: '#2C2C2E', color: '#fff', borderRadius: 8, padding: 10, marginVertical: 6 },
  autocompleteList: { backgroundColor: '#2C2C2E', borderRadius: 8, marginBottom: 6, maxHeight: 150 },
  autocompleteItem: { color: '#fff', padding: 8, borderBottomColor: '#3A3A3C', borderBottomWidth: 1 },
  selectedRecipients: { flexDirection: 'row', flexWrap: 'wrap', marginVertical: 6 },
  recipientChip: { backgroundColor: '#0A84FF33', color: '#fff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, margin: 2 },
  richEditor: { borderWidth: 1, borderColor: '#444', borderRadius: 8, minHeight: 150, marginTop: 8 },
  richToolbar: { backgroundColor: '#2C2C2E', borderRadius: 8, marginTop: 8 },
  composeActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelButton: { padding: 10, backgroundColor: '#2C2C2E', borderRadius: 8, width: '48%', alignItems: 'center' },
  cancelButtonText: { color: '#fff', fontWeight: '600' },
  sendButton: { padding: 10, backgroundColor: '#0A84FF', borderRadius: 8, width: '48%', alignItems: 'center' },
  sendButtonText: { color: '#fff', fontWeight: '600' },
  formatBar: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  formatButton: { backgroundColor: '#2C2C2E', borderRadius: 6, padding: 6, margin: 4 },
  formatButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  clickCircleContainer: { marginTop: 50, alignItems: 'center', justifyContent: 'center', width: '100%' },
  clickButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#007AFF', alignItems: 'center', justifyContent: 'center', },
  clickText: { color: '#FFFFFF', fontSize: 26, fontWeight: 'bold' },
  clickScore: { color: '#FFFFFF', fontSize: 24, marginTop: 40, fontWeight: '600', textAlign: 'center' },
  leaderboardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: '#1E1E1E' },
  leaderboardRank: { color: '#888', fontSize: 18, width: 30, textAlign: 'left' },
  leaderboardName: { color: '#FFFFFF', fontSize: 18, flex: 1 },
  leaderboardScore: { color: '#00A8FF', fontSize: 18, fontWeight: '600', textAlign: 'right' },
  clickerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginHorizontal: 20, marginTop: 10, paddingRight: 50 },
  clickerTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', textAlign: 'center', flex: 1 },
  backButtonInline: { padding: 10 },
  shopButton: {},
  shopContainer: { backgroundColor: '#2C2C2E', margin: 30, borderRadius: 16, padding: 20, alignItems: 'center' },
  shopTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  shopSubtitle: { color: '#A0A0A0', fontSize: 14, marginBottom: 20 },
  upgradeButton: { backgroundColor: '#007AFF', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%', alignItems: 'center' },
  upgradeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  floaterText: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', position: 'absolute' },
  devInput: { backgroundColor: '#2C2C2E', color: '#FFF', borderRadius: 8, padding: 10, width: '100%', marginVertical: 6, fontSize: 16, },
  blurLabel: { color: '#FFFFFF', fontSize: 16, marginTop: 8, textAlign: 'center' },
  settingsCard: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%' },
  settingsCardTitle: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  settingsCardSubtitle: { color: '#8E8E93', fontSize: 14, marginBottom: 10 },
  colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#3A3A3C' },
  colorLabel: { color: '#FFFFFF', fontSize: 16, flex: 1 },
  upgradeButton: { backgroundColor: "#007AFF", borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  upgradeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  previewImage: { width: '100%', height: 180, borderRadius: 10, marginTop: 10, resizeMode: 'cover' },
  previewPlaceholder: { width: '100%', height: 180, borderRadius: 10, backgroundColor: '#3A3A3C', alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  placeholderText: { color: '#8E8E93', fontSize: 16 },
  blurLabel: { color: '#A0A0A0', fontSize: 15, textAlign: 'center', marginTop: 8 },
  autocompleteWrapper: { position: 'absolute', top: 45, left: 0, right: 0, zIndex: 9999, backgroundColor: '#1C1C1E', borderRadius: 6, maxHeight: 200, borderWidth: 1, borderColor: '#2C2C2E', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 10, },
  autocompleteList: { paddingVertical: 4, },
  autocompleteItem: { paddingVertical: 8, paddingHorizontal: 10, color: '#FFF', borderBottomWidth: 1, borderBottomColor: '#2C2C2E', },
  notificationBadge: { position: 'absolute', right: 0, top: 0, backgroundColor: '#FF3B30', borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#1C1C1E', zIndex: 10, },
  notificationText: { color: '#FFFFFF', fontSize: 12, fontWeight: 'bold', },
});

export default AppWrapper;