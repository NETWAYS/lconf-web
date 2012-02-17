#!/bin/bash

PREFIX='/usr/local/lconf-web'
CACHEDIR='/usr/local/lconf-web/app/cache'
EXIT=0
NOTHING=true

function msg_start {
	echo -n "$1 ... "
}

function msg_result {
	EXIT=$?

	if [[ $EXIT -gt 0 ]]; then
		echo "fail"
	else
		echo "ok"
	fi

	NOTHING=false
}

if [[ $UID -gt 0 ]]; then
	echo "You should run this as root"
	exit 1
fi

if [[ ! -e $PREFIX ]]; then
	echo "Basedir '$PREFIX' does not exist!"
	exit 1
fi

echo "Basedir: $PREFIX Cachedir: $CACHEDIR"

CCDIR="$CACHEDIR/config $CACHEDIR/content $CACHEDIR/CronkTemplates $CACHEDIR/Squished"

for CUR_CDIR in $CCDIR; do
	CC_FILES=$(ls $CUR_CDIR/* 2>/dev/null | wc -l)
	if [[ $CC_FILES -gt 0 ]]; then

		CUR_CNAME=$(basename $CUR_CDIR)

		msg_start "Deleting cache from $CUR_CNAME ($CC_FILES files)"

		rm $CUR_CDIR/* > /dev/null 2>&1

		msg_result

	fi
done

if [[ $NOTHING == true ]]; then
	echo "Cache already purged!"
fi

exit $EXIT
