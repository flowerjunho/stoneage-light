
int BATTLE_GuardAdjust( int damage )
{
	int Rand = RAND( 1, 100 );
	if( Rand <= 25 ){
		damage *= 0.00;
	}else{
		if( Rand <= 50 ){
			damage *= 0.10;
		}else{
			if( Rand <= 70 ){
				damage *= 0.20;
			}else{
				if( Rand <= 85 ){
					damage *= 0.30;
				}else{
					if( Rand <= 95 ){
						damage *= 0.40;
					}else{
						damage *= 0.50;
					}
				}
			}
		}
	}
	return damage;
}

//¼ÆËãÉËº¦Öµ
