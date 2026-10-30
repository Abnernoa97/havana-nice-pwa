import React from 'react';
import {Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {MEMBER_MODULES,type MemberScreen} from '@havana/shared';
import NativeCalendar from './NativeCalendar';

type Props={
  displayName:string;
  token:string;
  active:Exclude<MemberScreen,'chat'>;
  onNavigate:(screen:MemberScreen)=>void;
};
// HOME is a navigation surface. Authentication and the native Chat remain
// owned by App.tsx: mounting HOME never issues, copies or revokes a token.
export default function NativeMemberHome({displayName,token,active,onNavigate}:Props){
  const selected=MEMBER_MODULES.find(module=>module.id===active);
  return <ScrollView style={styles.root} contentContainerStyle={styles.content}>
    <View style={styles.top}>
      <Text style={styles.brand}>HAVANA NICE</Text>
      <Text style={styles.subheading}>ESPACIO DEL EQUIPO · V2</Text>
    </View>
    {active==='home'?<>
      <Text style={styles.eyebrow}>ACCESO AUTORIZADO</Text>
      <Text style={styles.title}>Inicio</Text>
      <Text style={styles.greeting}>Bienvenido, {displayName}.</Text>
      <Text style={styles.lead}>Todo el equipo en un solo lugar.</Text>
      <View style={styles.modules}>
        {MEMBER_MODULES.map(module=><Pressable key={module.id}
          style={styles.tile} accessibilityRole="button"
          accessibilityLabel={'Abrir '+module.label}
          onPress={()=>onNavigate(module.id)}>
          <View style={styles.tileHead}>
            <Text style={styles.symbol}>{module.glyph}</Text>
            <Text style={styles.tileTitle}>{module.label}</Text>
          </View>
          <Text style={styles.tileBody}>{module.description}</Text>
          <Text style={styles.tileState}>{module.nativeReady?'Disponible':'En preparación'}</Text>
        </Pressable>)}
      </View>
    </>:<>
      <Pressable accessibilityRole="button" accessibilityLabel="Volver a Inicio"
        style={styles.back} onPress={()=>onNavigate('home')}>
        <Text style={styles.backLabel}>‹ Inicio</Text>
      </Pressable>
      <Text style={styles.title}>{selected?.label||'Módulo'}</Text>
      <Text style={styles.lead}>{selected?.description}</Text>
      {active==='calendar'?<NativeCalendar token={token}/>:<View style={styles.pending}>
        <Text style={styles.pendingTitle}>Módulo en preparación</Text>
        <Text style={styles.pendingDescription}>
          Aquí aparecerán datos reales cuando este módulo quede conectado al Administrador.
        </Text>
      </View>}
    </>}
  </ScrollView>;
}
const styles=StyleSheet.create({
  root:{flex:1,backgroundColor:'#F3EDDF'},
  content:{padding:24,paddingBottom:55},
  top:{paddingTop:14,paddingBottom:25,borderBottomWidth:1,borderBottomColor:'#d8cdbc',marginBottom:25},
  brand:{fontSize:13,fontWeight:'800',letterSpacing:3.1,color:'#24251f'},
  subheading:{fontSize:10,letterSpacing:1.5,color:'#766b61',marginTop:7},
  eyebrow:{fontSize:10,letterSpacing:1.5,color:'#927456',fontWeight:'700'},
  title:{fontSize:39,fontWeight:'700',marginTop:7,color:'#24251f'},
  greeting:{fontSize:17,fontWeight:'600',marginTop:18,color:'#24251f'},
  lead:{fontSize:14,lineHeight:21,color:'#726a5f',marginTop:7,marginBottom:20},
  modules:{flexDirection:'row',flexWrap:'wrap',gap:11},
  tile:{width:'48%',minHeight:146,backgroundColor:'#fffaf2',borderRadius:17,
    padding:15,borderWidth:1,borderColor:'#d9cdbd',justifyContent:'space-between'},
  tileHead:{gap:7},
  symbol:{fontSize:24,color:'#5b6756'},
  tileTitle:{fontSize:17,fontWeight:'700',color:'#24251f'},
  tileBody:{fontSize:11,lineHeight:17,color:'#786e61',marginTop:8},
  tileState:{fontSize:10,color:'#85796a',marginTop:12},
  back:{paddingVertical:9,alignSelf:'flex-start',marginBottom:10},
  backLabel:{fontSize:15,fontWeight:'700',color:'#7c5e44'},
  pending:{borderWidth:1,borderColor:'#d4c5b4',borderRadius:17,backgroundColor:'#fffaf2',
    marginTop:24,padding:22,minHeight:150,justifyContent:'center'},
  pendingTitle:{fontSize:19,fontWeight:'700',color:'#24251f'},
  pendingDescription:{fontSize:13,lineHeight:20,color:'#786e61',marginTop:9},
});
