const calenderPage = () => {
    return (
        <>
            <iframe
                title='Calendar'
                src='https://timetreeapp.com/public_calendars/kohokukeiongaku/embed/monthly?calendar_name=true&frame_color=%23ffffff'
                style={{ width: '100%', minHeight: '700px', aspectRatio: '680/720', border: 'none' }}
            />
        </>
    )
}

export default calenderPage