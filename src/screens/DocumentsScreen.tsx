import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native';
import {errorCodes, isErrorWithCode, pick, types} from '@react-native-documents/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {deleteDocument, downloadDocument, fetchDocuments, uploadDocument} from '../api/tourApi';
import {AppColors, useColors} from '../theme/theme';
import {DocumentDirection, NavScreen, TravelDocument} from '../types';
import {showApiError} from '../utils/toast';
import {useAppDialog} from '../components/AppDialog';
import {DocumentListSkeleton} from '../components/Skeleton';

interface Props {onNavigate: (screen: NavScreen) => void;}

export const DocumentsScreen: React.FC<Props> = () => {
  const colors = useColors();
  const styles = makeStyles(colors);
  const {showDialog} = useAppDialog();
  const [documents, setDocuments] = useState<TravelDocument[]>([]);
  const [activeTab, setActiveTab] = useState<DocumentDirection>('incoming');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('ID_PROOF');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchDocuments();
      const data: any = response.data;
      setDocuments(Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : []);
    } catch (error) { showApiError(error, 'We could not load your documents.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chooseAndUpload = async () => {
    if (!title.trim()) { showApiError(new Error('Add a title first.'), 'A document title is required.'); return; }
    try {
      const [picked] = await pick({type: [types.allFiles], mode: 'import'});
      setUploading(true);
      await uploadDocument({uri: picked.uri, name: picked.name || 'document', type: picked.type || undefined}, documentType.trim() || 'ID_PROOF', title.trim(), description.trim());
      setShowForm(false); setTitle(''); setDescription('');
      await load();
    } catch (error: any) {
      if (!(isErrorWithCode(error) && error.code === errorCodes.OPERATION_CANCELED)) showApiError(error, 'We could not upload this document.');
    } finally { setUploading(false); }
  };

  const openDocument = async (document: TravelDocument) => {
    try {
      const response = await downloadDocument(document.id);
      const url = response.data?.download_url || document.file_url;
      if (!url) throw new Error('No download link was returned.');
      await Linking.openURL(url);
    } catch (error) { showApiError(error, 'We could not open this document.'); }
  };

  const removeDocument = async (document: TravelDocument) => {
    const confirmed = await showDialog({title: 'Delete this document?', message: 'This file will be permanently removed from your account.', variant: 'warning', confirmText: 'Delete', cancelText: 'Cancel'});
    if (!confirmed) return;
    setDeleting(document.id);
    try { await deleteDocument(document.id); setDocuments(items => items.filter(item => item.id !== document.id)); }
    catch (error) { showApiError(error, 'We could not delete this document.'); }
    finally { setDeleting(null); }
  };

  const visibleDocuments = documents.filter(document => document.type === activeTab);
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} colors={[colors.primary]} />}>
    <View style={styles.intro}><View style={styles.introIcon}><Ionicons name="folder-open-outline" size={25} color={colors.primary} /></View><View style={styles.introCopy}><Text style={styles.title}>My documents</Text><Text style={styles.subtitle}>Keep travel files together and accessible.</Text></View></View>
    <View style={styles.tabs}>{(['incoming', 'outgoing'] as DocumentDirection[]).map(tab => <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}><Ionicons name={tab === 'incoming' ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'} size={17} color={activeTab === tab ? colors.textLight : colors.textSecondary} /><Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab === 'incoming' ? 'Incoming' : 'Outgoing'}</Text></Pressable>)}</View>
    <Pressable style={styles.uploadButton} onPress={() => setShowForm(value => !value)} disabled={uploading}><Ionicons name="cloud-upload-outline" size={19} color="#fff" /><Text style={styles.uploadText}>{uploading ? 'Uploading...' : 'Upload document'}</Text></Pressable>
    {showForm && <View style={styles.form}><Text style={styles.formTitle}>New document</Text><TextInput value={title} onChangeText={setTitle} placeholder="Document title" placeholderTextColor={colors.textMuted} style={styles.input} /><TextInput value={documentType} onChangeText={setDocumentType} placeholder="Type, e.g. ID_PROOF" placeholderTextColor={colors.textMuted} style={styles.input} autoCapitalize="characters" /><TextInput value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor={colors.textMuted} style={[styles.input, styles.multiline]} multiline /><Pressable style={styles.chooseButton} onPress={chooseAndUpload} disabled={uploading}><Text style={styles.chooseText}>{uploading ? 'Please wait...' : 'Choose file and upload'}</Text></Pressable></View>}
    {loading && visibleDocuments.length === 0 ? <DocumentListSkeleton /> : visibleDocuments.length === 0 ? <View style={styles.empty}><Ionicons name="document-text-outline" size={34} color={colors.textMuted} /><Text style={styles.emptyTitle}>No {activeTab} documents</Text><Text style={styles.emptyText}>{activeTab === 'incoming' ? 'Files shared with you will appear here.' : 'Upload a file to share it with your travel team.'}</Text></View> : visibleDocuments.map(document => <View style={styles.card} key={document.id}><View style={styles.fileIcon}><Ionicons name="document-attach-outline" size={22} color={colors.primary} /></View><View style={styles.cardCopy}><Text style={styles.cardTitle} numberOfLines={1}>{document.title || document.file_name || 'Untitled document'}</Text><Text style={styles.meta}>{document.document_type} {document.file_name ? `· ${document.file_name}` : ''}</Text>{document.description ? <Text style={styles.description} numberOfLines={2}>{document.description}</Text> : null}<Text style={styles.date}>{document.uploaded_at ? new Date(document.uploaded_at).toLocaleDateString() : 'Recently uploaded'}</Text></View><View style={styles.actions}><Pressable onPress={() => openDocument(document)} hitSlop={8}><Ionicons name="download-outline" size={21} color={colors.primary} /></Pressable>{document.can_delete !== false && <Pressable onPress={() => removeDocument(document)} disabled={deleting === document.id} hitSlop={8}><Ionicons name="trash-outline" size={20} color={colors.danger} /></Pressable>}</View></View>)}
  </ScrollView>;
};

const makeStyles = (colors: AppColors) => StyleSheet.create({container:{flex:1,backgroundColor:colors.bg},content:{padding:16,paddingBottom:35},intro:{flexDirection:'row',alignItems:'center',marginBottom:18},introIcon:{width:48,height:48,borderRadius:14,backgroundColor:colors.primarySubtle,alignItems:'center',justifyContent:'center',marginRight:12},introCopy:{flex:1},title:{fontSize:22,fontWeight:'900',color:colors.text},subtitle:{fontSize:12,color:colors.textSecondary,marginTop:3},tabs:{flexDirection:'row',backgroundColor:colors.surface,borderRadius:11,padding:4,marginBottom:12},tab:{flex:1,flexDirection:'row',gap:6,alignItems:'center',justifyContent:'center',paddingVertical:11,borderRadius:8},activeTab:{backgroundColor:colors.primary},tabText:{fontSize:13,fontWeight:'800',color:colors.textSecondary},activeTabText:{color:colors.textLight},uploadButton:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:colors.goldDark,borderRadius:10,paddingVertical:13,marginBottom:12},uploadText:{color:'#fff',fontWeight:'900',fontSize:13},form:{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:13,marginBottom:12},formTitle:{fontSize:15,fontWeight:'900',color:colors.text,marginBottom:9},input:{borderWidth:1,borderColor:colors.border,borderRadius:8,color:colors.text,paddingHorizontal:11,paddingVertical:10,fontSize:13,marginBottom:8},multiline:{minHeight:64,textAlignVertical:'top'},chooseButton:{backgroundColor:colors.primary,paddingVertical:11,borderRadius:8,alignItems:'center'},chooseText:{color:colors.textLight,fontWeight:'800',fontSize:12},loader:{marginVertical:35},empty:{alignItems:'center',paddingVertical:45},emptyTitle:{fontSize:15,fontWeight:'900',color:colors.text,marginTop:10},emptyText:{fontSize:12,color:colors.textSecondary,textAlign:'center',marginTop:5},card:{flexDirection:'row',alignItems:'center',backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:12,padding:13,marginBottom:9},fileIcon:{width:40,height:40,borderRadius:10,backgroundColor:colors.primarySubtle,alignItems:'center',justifyContent:'center',marginRight:11},cardCopy:{flex:1},cardTitle:{fontSize:14,fontWeight:'900',color:colors.text},meta:{fontSize:10,color:colors.textSecondary,marginTop:4},description:{fontSize:11,color:colors.textSecondary,marginTop:5},date:{fontSize:10,color:colors.textMuted,marginTop:5},actions:{flexDirection:'row',gap:15,marginLeft:10}});
