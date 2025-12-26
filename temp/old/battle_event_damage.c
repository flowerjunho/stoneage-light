//计算伤害值
int BATTLE_DamageCalc( int attackindex, int defindex )
{
	float attack, defense;
	int damage = 0;
	int attackpet = BATTLE_getRidePet( attackindex );
	int defpet = BATTLE_getRidePet( defindex );
	
	// Robin 0727 Ride Pet
	if( attackpet == -1 )	{
		attack = CHAR_getWorkInt( attackindex, CHAR_WORKATTACKPOWER );
	}else	{
		attack = BATTLE_adjustRidePet3A( attackindex, attackpet, CHAR_WORKATTACKPOWER, ATTACKSIDE );
	}
		if( defpet == -1 )	{
#ifdef _BATTLE_NEWPOWER
			defense = CHAR_getWorkInt( defindex, CHAR_WORKDEFENCEPOWER ) * 0.70;
#else
			defense = CHAR_getWorkInt( defindex, CHAR_WORKDEFENCEPOWER ) * 0.45;
			defense += CHAR_getWorkInt( defindex, CHAR_WORKQUICK ) * 0.2;
			defense += CHAR_getWorkInt( defindex, CHAR_WORKFIXVITAL ) * 0.1;
#endif
		}else	{
#ifdef _BATTLE_NEWPOWER
			defense = BATTLE_adjustRidePet3A( defindex, defpet, CHAR_WORKDEFENCEPOWER, DEFFENCESIDE ) * 0.70;
#else
			defense = BATTLE_adjustRidePet3A( defindex, defpet, CHAR_WORKDEFENCEPOWER, DEFFENCESIDE ) * 0.45;
			defense += BATTLE_adjustRidePet3A( defindex, defpet, CHAR_WORKQUICK, DEFFENCESIDE ) * 0.20;
			defense += CHAR_getWorkInt( defindex, CHAR_WORKFIXVITAL ) * 0.05;	
#endif
		}

#ifdef _MAGIC_SUPERWALL //铁壁防御
		if( CHAR_getWorkInt( defindex, CHAR_MAGICSUPERWALL ) > 0 ){
			float def = (float)(CHAR_getWorkInt( defindex, CHAR_OTHERSTATUSNUMS ));
			def = (def + rand()%20)/100;
			defense += defense * def;
		}
#endif
#ifdef _NPCENEMY_ADDPOWER //修改怪物的能力值
		if( CHAR_getInt( defindex, CHAR_WHICHTYPE ) == CHAR_TYPEENEMY )	{
			defense += (defense*(rand()%10)+2)/100;
		}
		if( CHAR_getInt( attackindex, CHAR_WHICHTYPE ) == CHAR_TYPEENEMY )	{
			attack += (attack*(rand()%10)+2)/100;
		}
#endif
	if( CHAR_getWorkInt( defindex, CHAR_WORKSTONE ) > 0 ) defense *= 2.0;

#ifdef _PETSKILL_REGRET
	//无装备防御
	if( CHAR_getWorkInt( attackindex, CHAR_WORKBATTLECOM1 ) == BATTLE_COM_S_REGRET
		|| CHAR_getWorkInt( attackindex, CHAR_WORKBATTLECOM1 ) == BATTLE_COM_S_REGRET2 )
		defense = CHAR_getWorkInt(defindex,CHAR_WORKFIXTOUGH);
#endif

#ifdef _EQUIT_NEGLECTGUARD //忽视目标防御力%
	if( CHAR_getWorkInt(  attackindex, CHAR_WORKNEGLECTGUARD) > 1 ) {
		float defp = (float)CHAR_getWorkInt(  attackindex, CHAR_WORKNEGLECTGUARD);
		defp = 1 - (defp/100);
		defense = defense*defp;
	}
#endif

	if( defense <= attack && attack < (defense * 8.0/7.0)   ){
		damage = (int)(RAND( 0, attack * D_16 ));
	}else
	if( defense > attack ){
		damage = (int)(RAND( 0, 1 ));
	}else
	if( attack >= (defense * 8/7)   ){
		float K0;
		K0 = RAND( 0, attack*D_8 ) - attack*D_16;
		damage = (int)(( (attack - defense )*DAMAGE_RATE ) + K0);
	}

	//四属性
	damage = BATTLE_AttrAdjust( attackindex, defindex, damage );
#ifdef _ADD_DEAMGEDEFC //额外伤害 & 附加攻击
	{
		int apower, dpower, otherpower;
		apower = CHAR_getWorkInt( attackindex, CHAR_WORKOTHERDMAGE);
		dpower = CHAR_getWorkInt( defindex, CHAR_WORKOTHERDEFC);

		otherpower = RAND( apower*0.3, apower) - RAND( dpower*0.3, dpower);
		if( otherpower != 0 )	{
			damage += otherpower;
		}
	}
	if( damage < 0 )
		damage = 0;
#endif
	
	return damage;
}

static int BATTLE_CriticalCheckPlayer( int attackindex, int defindex )
{
	int At_Dex, At_Luck = 0, At_Kiryoku = 0, At_Soubi = 0;
	int At_SoubiIndex, Df_Dex, root = 1;
	float per, Work, Big, Small, wari, divpara = gCriticalPara;

	// WON REM 
	//if( gWeponType == ITEM_BOW )return 0;

	At_Dex = CHAR_getWorkInt( attackindex, CHAR_WORKFIXDEX );
	Df_Dex = CHAR_getWorkInt( defindex, CHAR_WORKFIXDEX );

	if( CHAR_getInt( attackindex, CHAR_WHICHTYPE ) == CHAR_TYPEPLAYER ){
		At_Luck = CHAR_getWorkInt( attackindex, CHAR_WORKFIXLUCK );
	}
