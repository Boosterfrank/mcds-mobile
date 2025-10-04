import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  Modal
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { SvgXml } from 'react-native-svg';
import moment from 'moment';

// --- SVG Icon Definitions ---
const homeIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5z"/></svg>`;
const assignmentsIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
const scheduleIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>`;
const menuIconXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`;

// --- Configuration ---
const BASE_URL = 'https://miamicountryday.myschoolapp.com';
const LOGIN_URL = `${BASE_URL}/`;
const CONTEXT_API_URL = `${BASE_URL}/api/webapp/context`;
const ASSIGNMENTS_API_URL = `${BASE_URL}/api/assignment2/StudentAssignmentCenterGet?displayByDueDate=true`;
const ASSIGNMENT_DETAIL_API_URL = `${BASE_URL}/api/assignment2/UserAssignmentDetailsGetAllStudentData`;
const SCHEDULE_API_URL = `${BASE_URL}/api/schedule/MyDayCalendarStudentList/`;
const APP_HOME_URL_FRAGMENT = '/app/';

const APP_VERSION = '1.6.7'; // Fixed ReferenceError

const CHANGELOG_DATA = [
    { version: '1.6.7', changes: ['Fixed ReferenceError for assignment details props.', 'SIX SEVEN!!!'] },
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
  
  const webviewRef = useRef(null);

  const fetchApiInWebView = (url, type = 'GENERIC', options = {}) => {
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
    webviewRef.current?.injectJavaScript(script);
  };

  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      const triggerRelogin = (reason) => {
        setIsLoading(false);
        setUserInfo(null);
        setAssignments(null);
        setSchedule({});
        setAuthStatus('LOGGED_OUT');
        setLoginReason(reason);
      };

      if (message.type === 'API_ERROR') {
        triggerRelogin(`API Error: ${message.error}. Please sign in again.`);
        return;
      }
      
      if (message.success) {
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
                setSchedule(prev => ({...prev, [dateKey]: responseData}));
            }
        } else if (message.type === 'ASSIGNMENT_DETAIL') {
            setAssignmentDetails(prev => ({...prev, [responseData.AssignmentIndexId]: responseData}));

        }
        setIsLoading(false);
      }
    } catch (e) { /* Ignore non-JSON messages */ }
  };

  const handleNavigationStateChange = (navState) => {
    if (!navState.loading && navState.url.includes(APP_HOME_URL_FRAGMENT) && authStatus === 'LOGGED_OUT') {
      setAuthStatus('LOGGING_IN');
    }
  };
  
  useEffect(() => {
    if (authStatus === 'LOGGING_IN' && !userInfo) {
       fetchApiInWebView(CONTEXT_API_URL, 'CONTEXT');
    }
  }, [authStatus]);
  
  const fetchAssignmentsCallback = useCallback(() => {
    if (!assignments) fetchApiInWebView(ASSIGNMENTS_API_URL, 'ASSIGNMENTS');
  }, [assignments]);
  
  const fetchScheduleCallback = useCallback((dateString) => {
      const url = `${SCHEDULE_API_URL}?scheduleDate=${encodeURIComponent(dateString)}&personaId=2`;
      if (!schedule[dateString]) fetchApiInWebView(url, 'SCHEDULE');
  }, [schedule]);

  const fetchAssignmentDetailsCallback = useCallback((assignmentIndexId) => {
    if (!userInfo) return;
    const url = `${ASSIGNMENT_DETAIL_API_URL}?assignmentIndexId=${assignmentIndexId}&studentUserId=${userInfo.UserId}&personaId=2`;
    fetchApiInWebView(url, 'ASSIGNMENT_DETAIL');
  }, [userInfo]);

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle={authStatus === 'LOGGED_IN' ? "light-content" : "dark-content"} />
      <Modal visible={isChangelogVisible} animationType="slide">
        <ChangelogPage onClose={() => setIsChangelogVisible(false)} />
      </Modal>

      {/* Persistent WebView is always rendered. It's hidden with styling when logged in. */}
      <View style={authStatus === 'LOGGED_IN' ? styles.webviewHidden : styles.webviewVisible}>
        <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
            <View style={styles.loginHeader}>
                <Text style={styles.loginTitle}>MCDS Mobile</Text>
                {authStatus === 'LOGGED_OUT' && <Text style={styles.subtitle}>{loginReason}</Text>}
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
        <View style={{flex: 1}}>
          <SafeAreaView/>
            <View style={styles.appHeader}>
                <Text style={styles.appTitle}>MCDS Mobile</Text>
            </View>
            <PageContent 
                activePage={activePage} 
                userInfo={userInfo} 
                assignments={assignments}
                fetchAssignments={fetchAssignmentsCallback}
                schedule={schedule}
                fetchSchedule={fetchScheduleCallback}
                isLoading={isLoading}
                assignmentDetails={assignmentDetails}
                fetchAssignmentDetails={fetchAssignmentDetailsCallback}
                onOpenChangelog={() => setIsChangelogVisible(true)}
            />
            <View style={{backgroundColor: styles.navBar.backgroundColor}}>
                <BottomNavBar activePage={activePage} onNavigate={setActivePage} />
                <SafeAreaView style={{backgroundColor: styles.navBar.backgroundColor}} edges={['bottom']} />
            </View>
        </View>
      )}
    </View>
  );
};

// --- Page Content Wrapper with Transitions ---

const PageContent = ({ activePage, userInfo, assignments, fetchAssignments, assignmentDetails, fetchAssignmentDetails, schedule, fetchSchedule, isLoading, onOpenChangelog }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }, [activePage]);

    let currentPageComponent;
    switch (activePage) {
        case 'Home': currentPageComponent = <HomePage userInfo={userInfo} />; break;
        case 'Assignments': currentPageComponent = <AssignmentCenterPage assignments={assignments} fetchAssignments={fetchAssignments} isLoading={isLoading} assignmentDetails={assignmentDetails} fetchAssignmentDetails={fetchAssignmentDetails} />; break;
        case 'Schedule': currentPageComponent = <SchedulePage scheduleData={schedule} fetchSchedule={fetchSchedule} isLoading={isLoading} />; break;
        case 'More': currentPageComponent = <MorePage onOpenChangelog={onOpenChangelog} />; break;
        default: currentPageComponent = <PlaceholderPage title="Not Found" />;
    }

    return <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>{currentPageComponent}</Animated.View>;
};

// --- Components ---
const LoadingOverlay = ({ text }) => <View style={styles.loadingOverlay}><ActivityIndicator size="small" color="#FFFFFF" /><Text style={styles.loadingText}>{text}</Text></View>;
const HomePage = ({ userInfo }) => {
  const photoUrl = `${BASE_URL}${userInfo.ProfilePhoto?.LargeFilenameEditedUrl}`;
  return (
    <View style={[styles.pageContentContainer, { justifyContent: 'center' }]}>
      <Text style={styles.greeting}>Hey, {userInfo.FirstName}!</Text>
       {userInfo.ProfilePhoto?.LargeFilenameEditedUrl ? (
        <Image source={{ uri: photoUrl }} style={styles.profileImage}/>
      ) : (
         <View style={[styles.profileImage, styles.profileImagePlaceholder]}><Text style={styles.profileImagePlaceholderText}>{userInfo.FirstName.charAt(0)}</Text></View>
      )}
      <Text style={styles.pageContentText}>Welcome to your dashboard.</Text>
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
            <ScrollView style={{width: '100%'}}>
                {isLoading && !scheduleForDay ? <ActivityIndicator size="large" color="#FFFFFF" style={{marginTop: 40}}/> :
                 scheduleForDay && scheduleForDay.length > 0 ? scheduleForDay.map((item, index) => (
                    <View key={index} style={styles.scheduleCard}>
                        <View style={[styles.scheduleColorBar, { backgroundColor: getColorForCourse(item.CourseTitle) }]} />
                        <View style={styles.scheduleTime}><Text style={styles.scheduleTimeText}>{item.MyDayStartTime}</Text><Text style={styles.scheduleTimeText}>{item.MyDayEndTime}</Text></View>
                        <View style={styles.scheduleDetails}><Text style={styles.scheduleCourseTitle}>{item.CourseTitle}</Text><Text style={styles.scheduleSubText}>{item.Contact}</Text><Text style={styles.scheduleSubText}>{item.BuildingName} - {item.RoomNumber}</Text></View>
                        <View style={styles.scheduleBlock}><Text style={styles.scheduleBlockText}>{item.Block}</Text></View>
                    </View>
                )) : <Text style={styles.noAssignmentsText}>No classes scheduled for this day.</Text>}
            </ScrollView>
        </View>
    );
};

const AssignmentCenterPage = ({ assignments, fetchAssignments, updateStatus, isLoading, assignmentDetails, fetchAssignmentDetails }) => {
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
    
    const allAssignments = assignments ? [...assignments.Overdue, ...assignments.DueToday, ...assignments.DueTomorrow, ...assignments.DueThisWeek, ...assignments.DueNextWeek, ...assignments.DueAfterNextWeek] : [];
    
    const today = moment().add(weekOffset, 'weeks');
    const startOfWeek = today.clone().startOf('week');
    const endOfWeek = today.clone().endOf('week');

    const filteredAssignments = allAssignments
        .filter(a => moment(a.DateDue, "M/D/YYYY h:mm A").isBetween(startOfWeek, endOfWeek))
        .sort((a, b) => new Date(a.DateDue) - new Date(b.DateDue));
        
    return (
        <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
            <AssignmentDetailModal 
              visible={!!selectedAssignment} 
              assignment={selectedAssignment}
              details={selectedAssignment ? assignmentDetails[selectedAssignment.AssignmentIndexId] : null}
              isLoadingDetails={selectedAssignment && !assignmentDetails[selectedAssignment.AssignmentIndexId]}
              onClose={() => setSelectedAssignment(null)} 
              onStatusUpdate={handleStatusUpdate} 
            />
            <Text style={styles.pageTitle}>Assignment Center</Text>
            <View style={styles.weekNavigator}>
                <TouchableOpacity onPress={() => setWeekOffset(weekOffset - 1)} style={styles.weekNavButton}><Text style={styles.weekNavText}>{'< Prev'}</Text></TouchableOpacity>
                <Text style={styles.weekHeaderText}>{startOfWeek.format('MMM D')} - {endOfWeek.format('MMM D, YYYY')}</Text>
                <TouchableOpacity onPress={() => setWeekOffset(weekOffset + 1)} style={styles.weekNavButton}><Text style={styles.weekNavText}>{'Next >'}</Text></TouchableOpacity>
            </View>
            <ScrollView style={{width: '100%'}}>
                {filteredAssignments.length > 0 ? filteredAssignments.map(item => <AssignmentCard key={item.AssignmentIndexId} assignment={item} onSelect={() => handleSelectAssignment(item)} />) : <Text style={styles.noAssignmentsText}>No assignments due this week.</Text>}
            </ScrollView>
        </View>
    );
};

const AssignmentCard = ({ assignment, onSelect }) => {
    const { status, color } = getStatusInfo(assignment.AssignmentStatusType);
    const cleanHtml = (str) => str?.replace(/<[^>]*>/g, '').replace(/&#160;/g, ' ') || '';
    return (<TouchableOpacity onPress={onSelect} style={styles.assignmentCard}><View style={styles.assignmentHeader}><Text style={styles.assignmentClass} numberOfLines={1}>{assignment.GroupName}</Text><Text style={[styles.assignmentStatus, { color }]}>{status}</Text></View><Text style={styles.assignmentDesc}>{cleanHtml(assignment.ShortDescription)}</Text><Text style={styles.assignmentDue}>Due: {moment(assignment.DateDue, "M/D/YYYY h:mm A").format('ddd, MMM D [at] h:mm A')}</Text></TouchableOpacity>);
};

const AssignmentDetailModal = ({ visible, assignment, details, isLoadingDetails, onClose, onStatusUpdate }) => {
    if (!assignment) return null;

    const { status, color } = getStatusInfo(assignment.AssignmentStatusType);
    const cleanHtml = (str) => str?.replace(/<[^>]*>/g, '').replace(/&#160;/g, ' ') || '';
    
    const gradeInfo = details?.AssignmentGrade;
    const maxPoints = details?.MaxPoints;
    
    return (
        <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalBackdrop}>
                <View style={styles.modalContainer}>
                    <Text style={styles.modalTitle} numberOfLines={2}>{assignment.GroupName}</Text>
                    <Text style={styles.modalDescription}>{cleanHtml(assignment.ShortDescription)}</Text>
                    
                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Status</Text>
                        <Text style={[styles.modalStatusText, { color }]}>{status}</Text>
                    </View>

                    <View style={styles.modalSection}>
                        <Text style={styles.modalSectionTitle}>Grade</Text>
                        {isLoadingDetails ? <ActivityIndicator color="#FFFFFF"/> :
                         gradeInfo && gradeInfo.HasGrade === 1 ?
                            <View>
                                <Text style={styles.modalContentText}>
                                    {gradeInfo.Grade || gradeInfo.GradebookGrade}{maxPoints ? ` / ${maxPoints}`: ''}
                                </Text>
                                {gradeInfo.GradedComment && 
                                    <Text style={styles.modalCommentText}>{cleanHtml(gradeInfo.GradedComment)}</Text>
                                }
                            </View> :
                            <Text style={styles.modalContentText}>Not Graded</Text>
                        }
                    </View>
                    
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
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

const MorePage = ({ onOpenChangelog }) => {
  const MenuItem = ({ label }) => (<TouchableOpacity style={styles.menuItem}><Text style={styles.menuItemText}>{label}</Text><Text style={styles.menuItemArrow}>{'>'}</Text></TouchableOpacity>);
  return (
    <View style={[styles.pageContentContainer, styles.placeholderAlignment]}>
      <Text style={styles.pageTitle}>More</Text>
      <ScrollView style={styles.menuList}><MenuItem label="Messages" /><MenuItem label="Settings" /><MenuItem label="Grades" /><MenuItem label="Classes" /><MenuItem label="Resources" /></ScrollView>
      <TouchableOpacity onLongPress={onOpenChangelog} delayLongPress={3000}><View style={styles.versionInfo}><Text style={styles.versionAppName}>MCDS Mobile</Text><Text style={styles.versionNumber}>Version {APP_VERSION}</Text></View></TouchableOpacity>
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

const PlaceholderPage = ({ title }) => <View style={[styles.pageContentContainer, styles.placeholderAlignment]}><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageContentText}>This feature is coming soon.</Text></View>;
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
  container: { flex: 1, backgroundColor: '#FFFFFF' }, // Main wrapper for login
  appContainer: { flex: 1, backgroundColor: '#1C1C1E' }, // Main wrapper for the app
  webviewVisible: { flex: 1, backgroundColor: '#FFFFFF' },
  webviewHidden: { position: 'absolute', top: -10000, left: 0, width: 0, height: 0, zIndex: -1 },
  loadingOverlay: { position: 'absolute',left: 0,right: 0,bottom: 0,backgroundColor: 'rgba(0, 0, 0, 0.7)',flexDirection: 'row',alignItems: 'center',justifyContent: 'center',padding: 10,zIndex: 10,},
  loadingText: { color: '#FFFFFF', marginLeft: 10, fontSize: 16 },
  loginHeader: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  loginTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#1C1C1E' },
  appHeader: { marginTop: -30, paddingHorizontal: 20, backgroundColor: '#1C1C1E'},
  appTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#D32F2F', textAlign: 'center', marginTop: 8, fontWeight: '500' },
  mainContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
  pageContentContainer: { flex: 1, width: '100%', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  placeholderAlignment: { justifyContent: 'flex-start' },
  pageTitle: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 20, alignSelf: 'flex-start' },
  pageContentText: { fontSize: 16, color: '#A0A0A0', marginTop: 10, textAlign: 'center' },
  greeting: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 30, },
  profileImage: { width: 150, height: 150, borderRadius: 75, borderWidth: 3, borderColor: '#007AFF', marginBottom: 20, backgroundColor: '#3A3A3C' },
  profileImagePlaceholder: { alignItems: 'center', justifyContent: 'center'},
  profileImagePlaceholderText: { color: '#FFFFFF', fontSize: 72, fontWeight: 'bold'},
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
  scheduleCard: { flexDirection: 'row', backgroundColor: '#2C2C2E', borderRadius: 12, marginBottom: 10, width: '100%', overflow: 'hidden'},
  scheduleColorBar: { width: 6 },
  scheduleTime: { padding: 15, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#3A3A3C'},
  scheduleTimeText: { color: '#E5E5EA', fontSize: 14 },
  scheduleDetails: { flex: 1, padding: 15},
  scheduleCourseTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  scheduleSubText: { color: '#8E8E93', fontSize: 14 },
  scheduleBlock: { padding: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#3A3A3C'},
  scheduleBlockText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  weekNavigator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingVertical: 10, marginBottom: 10 },
  weekNavButton: { padding: 10 },
  weekNavText: { color: '#007AFF', fontSize: 16 },
  weekHeaderText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  assignmentCard: { backgroundColor: '#2C2C2E', borderRadius: 12, padding: 15, marginBottom: 15, width: '100%'},
  assignmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  assignmentClass: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10 },
  assignmentStatus: { fontSize: 12, fontWeight: '700' },
  assignmentDesc: { color: '#E5E5EA', fontSize: 14, marginBottom: 12 },
  assignmentDue: { color: '#8E8E93', fontSize: 12 },
  noAssignmentsText: { color: '#8E8E93', textAlign: 'center', marginTop: 40, fontSize: 16},
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
  changelogContainer: {flex: 1, backgroundColor: '#1C1C1E' },
  changelogHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 60, backgroundColor: '#1C1C1E' },
  changelogContent: { paddingHorizontal: 20 },
  changelogVersion: { marginBottom: 25 },
  changelogVersionTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  changelogChangeItem: { color: '#E5E5EA', fontSize: 16, marginBottom: 5, paddingLeft: 10, lineHeight: 22 }
});


export default AppWrapper;