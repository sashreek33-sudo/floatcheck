# The Planning Engineer's Toolkit — An Explainer

*Written to be listened to. Read it aloud, or paste it into a text-to-speech app.*

*Estimated listening time: around 60 minutes.*

---

## Before we start

A quick note on how to use this.

This is written from absolute zero. It assumes you know nothing about scheduling, nothing about critical path method, nothing about the code. That's deliberate. If you already know a bit, some of the early chapters will feel slow — that's fine, let them wash over you, because the later chapters build directly on the language set up in the early ones.

There's one small example project that runs through this entire thing. Five activities. Small enough to hold in your head. Every concept — float, critical path, crashing, all of it — gets demonstrated on that same tiny project. So if you learn that one example properly, you can reason about a schedule with fifty thousand activities, because the maths is identical, there's just more of it.

One more thing. At the end of this, you should be able to sit in an interview and have someone ask you "so how does the crashing algorithm actually work" and answer it properly. That's the bar. Not "I built a tool." Anyone can say that. The bar is being able to explain the engineering underneath it, including the parts where it's imperfect.

Right. Let's go.

---

## Chapter One — What a schedule actually is

Let's start somewhere completely non-technical.

Imagine you're moving house. Not a big deal, but there's a bunch of things that have to happen. You need to pack your stuff. You need to book a truck. You need to clean the old place. You need to get the keys to the new place. You need to actually drive everything over.

Now, some of those things can happen in any order. You could clean before or after you pack. But some of them absolutely cannot. You can't drive your furniture to the new house before you've got the keys. You can't load the truck before you've booked the truck.

That right there — that set of tasks, and the rules about which ones have to come before which other ones — that's a schedule. That's genuinely all it is. A construction schedule for a two-billion-dollar tunnel project is the same idea. It's just got forty thousand tasks instead of five, and the consequences of getting the order wrong are measured in millions of dollars rather than a wasted Saturday.

In construction, we don't call them tasks. We call them **activities**. And that word matters, because it's the word the software uses and the word people use on site. An activity is one discrete piece of work with a start, an end, and a duration. "Excavate the pit." "Pour the base slab." "Install the props." Each one is an activity.

Every activity has a **duration** — how long it takes. Usually measured in working days, which is an important distinction we'll come back to, because working days don't include weekends, and that catches people out constantly.

And activities have **relationships** between them. Also called dependencies, also called logic. Same thing, three names, because construction loves having three names for everything. A relationship says "this activity can't start until that one finishes."

So: activities, durations, relationships. That's a schedule. Three things.

Now here's the question that turns this from a to-do list into engineering: **if you know all the activities, all the durations, and all the relationships — can you calculate when the project will finish?**

And the answer is yes. Precisely. And the method for doing it is what the rest of this is about.

---

## Chapter Two — The example project

Let me give you the example we're going to use for everything.

We're pouring a small concrete slab. Five activities. Here they are.

**Activity A — Excavate.** Dig the hole. Takes three days.

**Activity B — Formwork.** Build the timber frame that holds the wet concrete in place. Takes two days. And obviously, you can't build the formwork until the hole is dug. So B depends on A.

**Activity C — Order and deliver the reinforcing steel.** The rebar. Takes four days, because it's got to be fabricated and trucked in. And here's the interesting part — this doesn't depend on anything. You can order the steel on day one, while the excavator is still digging. It happens in parallel.

**Activity D — Fix the rebar.** Actually tie the steel into position inside the formwork. Takes two days. And this one needs two things: it needs the formwork built, and it needs the steel to have arrived. So D depends on both B and C.

**Activity E — Pour the concrete.** One day. Depends on D, because you obviously don't pour concrete before the steel's in.

That's the project. Say it back to yourself: dig, form up, steel arrives in parallel, fix steel, pour.

Now — how long does this project take?

Have a go at it before I tell you. It's not just adding up the durations, because some things happen at the same time.

---

## Chapter Three — The forward pass

Here's how you work it out properly. It's called the **forward pass**, and it does exactly what it sounds like — you walk forward through the project from the start, and at each activity you work out the earliest it could possibly happen.

Two numbers per activity. **Early Start** — the earliest day this activity could begin. And **Early Finish** — the earliest day it could be done.

The rule for early finish is dead simple. Early Finish equals Early Start plus Duration. If you start on day zero and it takes three days, you finish on day three.

The rule for early start is the important one, and it's this: **an activity can start as soon as all of its predecessors have finished. Which means it starts when the LAST of them finishes.** Not the first. The last. Because you need all of them done.

Let's walk it.

**Activity A, excavate.** Nothing comes before it. So it starts on day zero. Three days duration. Early Start zero, Early Finish three.

**Activity C, the steel delivery.** Also nothing before it. Starts day zero. Four days. Early Start zero, Early Finish four. Notice it's running at the same time as A. That's fine. That's normal. Real projects have hundreds of things happening in parallel.

**Activity B, formwork.** Depends on A. A finishes on day three. So B starts on day three. Two days duration. Early Start three, Early Finish five.

**Activity D, fix rebar.** Here's the interesting one. D depends on both B and C. B finishes day five. C finishes day four. Which one controls?

The later one. Day five. Because even though the steel showed up on day four, you can't fix it into formwork that isn't built yet. So D starts on day five. Two days. Early Start five, Early Finish seven.

**Activity E, pour.** Depends on D, which finishes day seven. One day duration. Early Start seven, Early Finish eight.

So the project takes **eight days**. That's the forward pass. You've just calculated a project completion date from first principles.

And notice — if you'd just added up all the durations, three plus two plus four plus two plus one, you'd have got twelve. The real answer is eight, because things run in parallel. That gap between "sum of all work" and "actual duration" is the whole reason scheduling is a discipline.

---

## Chapter Four — The backward pass

Now we do it in reverse, and this is where it gets genuinely clever.

The forward pass told us the earliest everything can happen. The **backward pass** tells us the *latest* everything can happen without making the project finish late.

Same idea, two numbers per activity. **Late Finish** — the latest this could finish without delaying the project. And **Late Start** — the latest it could start.

Late Start equals Late Finish minus Duration. Straightforward.

The rule for Late Finish is the mirror image of the forward pass rule, and it trips people up, so listen carefully: **an activity must finish before the earliest of its successors needs to start.** Forward pass took the maximum. Backward pass takes the minimum. Max going forward, min going backward. If you remember one thing about the mechanics, remember that.

Why the minimum? Because if an activity feeds three other activities, and the earliest of those needs to start on day ten, then you'd better be finished by day ten. Being finished by day fifteen is no good, even if the other two successors don't start until day twenty.

Let's walk it backwards. We start at the end and we say: the project finishes on day eight, and we're not willing to go later than that.

**Activity E, pour.** It's the last activity. Late Finish is day eight. Duration one day. So Late Start is day seven.

**Activity D, fix rebar.** Its only successor is E, which needs to start on day seven. So D's Late Finish is day seven. Duration two. Late Start day five.

**Activity B, formwork.** Successor is D, which starts at the latest on day five. So B's Late Finish is day five. Duration two. Late Start day three.

**Activity C, steel delivery.** Successor is also D, which starts at the latest on day five. So C's Late Finish is also day five. Duration four. Late Start is day one.

Stop there for a second. That's interesting. C's *early* start was day zero. But its *late* start is day one. Those are different numbers. Hold that thought, it's the whole next chapter.

**Activity A, excavate.** Successor is B, which starts at the latest day three. So A's Late Finish is day three. Duration three. Late Start day zero.

Done. Backward pass complete.

---

## Chapter Five — Float

Now the payoff.

For most of those activities, the early start and the late start were the same number. A could start on day zero at the earliest, and had to start on day zero at the latest. No wiggle room. Same for B, D, and E.

But C — the steel delivery — could start as early as day zero, but didn't have to start until day one. It's got one day of slack in it.

That slack is called **float**. Sometimes called total float, sometimes called slack. Same thing.

The definition: **float is how much an activity can slip without delaying the project finish.**

And the calculation is beautifully simple. Float equals Late Start minus Early Start. Or equivalently, Late Finish minus Early Finish. Both give the same answer.

For C: late start one, minus early start zero, equals **one day of float**. The steel could show up a day late and it wouldn't matter. The formwork would still be the thing holding up the rebar fixing.

For A, B, D and E: late start minus early start equals **zero**. Zero float. No slack whatsoever.

This is genuinely the most important concept in project controls, so let me say it a different way. Float is your buffer. It's how much trouble an activity can get into before that trouble becomes the whole project's problem. An activity with twenty days of float can go badly wrong and nobody outside that crew will ever notice. An activity with zero float — if that slips by one day, the entire project finishes one day later. Every single time. Guaranteed.

And that leads us straight into the next idea.

---

## Chapter Six — The critical path

**The critical path is the chain of activities with zero float.**

In our example, that's A, then B, then D, then E. Dig, form, fix steel, pour. Those four are critical. The steel delivery, C, is not — it's got that one day of float.

The critical path is called that because it *is* critical. It's the longest path through the network, and it determines the project duration. If you want the project to finish sooner, you must shorten something on the critical path. Speeding up anything else is completely pointless — you'll just create more float on an activity that already had some.

This is the single most useful thing scheduling gives you. On a project with forty thousand activities, the critical path might be four hundred of them. That's where the project manager should be spending attention. The other thirty-nine thousand six hundred activities matter, but they're not what's controlling the finish date today.

Two more terms you'll hear, and they're worth knowing.

**Near-critical.** Activities with a small amount of float — say, five days or less. They're not controlling the project right now, but they're one bad week away from doing so. Good planners watch these obsessively, because the critical path *moves*. Something with three days float that loses four days doesn't just lose its buffer, it becomes the new critical path and starts driving the finish date.

**Negative float.** This one's important and slightly weird. If a project has a deadline imposed on it — a contract completion date — and the calculated finish is later than that date, the backward pass starts from the contract date instead of the calculated date. Which means some activities end up with a late start that's *earlier* than their early start. Negative float. It means "this activity is already late before it's even started." Negative float is an alarm bell. It means the schedule as it currently stands cannot meet the deadline.

---

## Chapter Seven — Primavera P6 and the XER file

So all of that maths — forward pass, backward pass, float, critical path — that's the Critical Path Method. CPM. Developed in the late nineteen fifties, and it hasn't fundamentally changed since, because it doesn't need to. It's just true.

Nobody does it by hand on real projects, obviously. Forty thousand activities is not a pen and paper job. So there's software.

The dominant software in big infrastructure is **Primavera P6**, made by Oracle. On Australian major projects — level crossing removals, tunnel projects, water infrastructure — P6 is the default. If you work in project controls in this country, you will use P6. It's clunky, it's dated, it's expensive, and it's completely entrenched.

P6 does the CPM calculation for you. You give it activities, durations and logic, you hit "schedule," and it runs the forward and backward pass across the whole network and tells you the finish date, the float on every activity, and the critical path.

Now — the **XER file**. This matters for understanding your tool.

An XER file is P6's export format. When you want to send a schedule to someone else, or archive it, or move it between databases, you export an XER. And here's the thing that makes your tool possible: **an XER file is just text.** It's not a locked binary format. If you open one in Notepad, you can read it.

It's structured a bit like a set of spreadsheets stuck together in one file. There's a table called PROJECT with the project details. A table called TASK with every activity — its code, its name, its duration, its dates, its float, its percentage complete. A table called TASKPRED with every relationship — which activity depends on which, what type, and any lag. A table called PROJWBS with the work breakdown structure, which is the folder-like hierarchy activities get organised into. And a table called TASKNOTE, which holds the **Notebook** entries.

Notebook is worth a special mention because it's central to your tool. It's a free-text notes field a planner can attach to any activity in P6. In practice, disciplined planners use it to record *why* something happened — "hit unforeseen services at chainage twelve metres, four days lost." That's gold, because it's the causal explanation sitting right next to the numerical data. Most tools ignore it entirely. Yours reads it.

Each table in the file starts with a line beginning with percent-T, which names the table. Then a line beginning with percent-F, which lists the field names — the column headers. Then a bunch of lines beginning with percent-R, which are the actual rows of data. Everything separated by tab characters.

That's it. That's the whole format. Which is why a parser for it is achievable rather than impossible.

---

## Chapter Eight — Updates, data dates, and what a planner actually does

Right. So a schedule gets built at the start of a project. That version, once it's agreed and locked, is called the **baseline**. It's the reference point — the thing you measure everything else against forever after.

But projects don't follow the plan. So every week, or every fortnight, the planner does an **update**.

An update means going out, finding out what actually happened, and putting it into the schedule. Which activities actually started, and when. Which finished. Which are part-way through and how far along. Which haven't started at all.

Then there's the **data date**. This is a concept that confuses people so let me be precise about it. The data date is the line in the sand — the moment the update is accurate as of. Everything before the data date is history: actual, recorded fact. Everything after the data date is forecast: what we currently believe will happen. When you hear a planner say "as of the data date," they mean "as of the snapshot we took on Monday."

So the planner enters all the actuals, sets the new data date, and hits schedule. P6 re-runs the entire forward and backward pass — using actual dates for what's done, and forecast durations for what isn't — and produces a new finish date, new float values, and quite possibly a completely different critical path from last fortnight.

**And then the actual work starts.** Because a new set of numbers isn't an answer. Someone has to look at it and figure out what changed, why, whether it matters, and what to do about it.

This is exactly where the research I did earlier lands. Practitioners in this field say the number one problem planning engineers face isn't lack of knowledge — it's lack of time. The described reality is that after the update, planners group and filter activities, copy data into Excel, apply formulas, format a report, then rinse and repeat as many times as needed. And because there's a deadline, it gets rushed. And rushed manual work is where errors get in.

That's the problem your tool attacks. Hold onto that, because it's the answer to "why did you build this."

---

## Chapter Nine — Variance analysis, which is what your first module does

**Variance analysis** means comparing two versions of the schedule and identifying what changed.

Usually it's this fortnight's update against last fortnight's update. Sometimes it's the current update against the original baseline. Same technique either way.

What you're looking for, in order of importance:

**Did the project finish date move?** That's the headline. If the finish went from the fifth of February to the third of March, that's the number everyone in the room cares about.

**Which activities slipped, and by how much?** Match each activity in the new file to the same activity in the old file by its activity code, and compare the finish dates.

**Where did float get eaten?** This is the subtler and more valuable one. An activity might not have slipped at all, but if its float dropped from twenty days to two days, something upstream has changed and that activity is now dangerously exposed. A planner who only looks at slipped activities misses this entirely.

**Did the critical path move?** Because if it did, everyone's attention needs to move with it. The crew that was the priority last fortnight might not be the priority this fortnight.

**And why did any of it happen?** This is the question that actually matters, and it's the one that numbers alone can't answer. This is where the Notebook entries come in.

Now — an honest note, because you need this in an interview. P6 does have a built-in comparison tool called **Claim Digger**. It'll show you date changes and logic changes between two schedules. So "nothing exists to compare schedules" would be a false claim and someone experienced would call you on it.

The real gap is narrower and more defensible. Claim Digger is built for forensic and claims work — it's what you reach for during a dispute, not every fortnight. It gives you a raw diff, not an interpretation. And it certainly doesn't write your report for you. For routine cycles, most planners don't run a formal comparison at all — they filter the current schedule, eyeball it against memory and site diaries, and write it up by hand.

So the honest positioning is: not "nobody compares schedules," but "nobody has a fast routine way to turn that comparison into a written explanation." Say it that way and you sound like you know the industry. Say it the other way and you sound like you Googled it.

---

## Chapter Ten — The DCMA fourteen-point check

This is your credibility module. It's the one that makes people who work in project controls look twice, because it's niche and it's real.

Here's the background. Schedules can be technically valid and completely useless. The software will happily calculate a critical path through a schedule that's built badly, and give you a confident finish date that means nothing. Garbage in, confident-looking garbage out.

So the US Defense Contract Management Agency — the DCMA — published a standardised set of fourteen checks for assessing whether a schedule is structurally sound. It's become an industry standard well beyond defence. If someone in project controls says "we ran a fourteen-point check," this is what they mean.

Let me go through the ones your tool actually implements, because you need to be able to explain each one.

**Check one, logic.** Every activity should have a predecessor and a successor. An activity with no predecessor is "dangling" — it's floating in time with nothing driving when it starts. An activity with no successor means nothing depends on it finishing, which is almost always wrong. There should be exactly one true start and one true finish in the whole project. Everything else should be connected at both ends. Threshold is under five percent open ends.

**Check two, leads.** A lead is a *negative* lag — a relationship that says "start this activity three days before its predecessor finishes." It's a way of overlapping work. The problem is it distorts the critical path calculation and hides the real logic. If two activities genuinely overlap, you should model that properly by splitting them, not by fudging a negative number. Threshold is zero. None at all.

**Check three, lags.** A positive lag is a deliberate wait between two activities — "pour the slab, wait seven days, then strip the formwork." Sometimes legitimate, like concrete curing. But lags get abused as a lazy way to make dates line up without modelling the real reason. Threshold is under five percent of relationships.

**Check four, relationship types.** There are four types of relationship. Finish-to-Start is the normal one — B starts after A finishes. There's also Start-to-Start, Finish-to-Finish, and the rare and generally suspicious Start-to-Finish. Finish-to-Start is the clearest and most defensible. Threshold is at least ninety percent Finish-to-Start.

**Check six, high duration activities.** Any activity longer than about forty-four working days — roughly two months — is too coarse. You can't meaningfully track progress on it, and you can't tell whether it's in trouble until it's far too late. Break it down. Threshold under five percent.

**Check seven, negative float.** Which we covered. Any negative float means the schedule can't meet its deadline as currently built. Threshold is zero.

**Check eight, high float.** Activities with more than forty-four working days of float are suspicious — usually it means they're missing logic and floating free rather than genuinely having two months of slack. Threshold under five percent.

**Check nine, invalid dates.** Activities missing start or finish dates, or with actual dates in the future, or forecast dates in the past. Data hygiene. Threshold zero.

**Check eleven, missed activities.** Activities that were forecast to finish before the data date but haven't been marked complete. In other words, things that should be done and aren't, and nobody's updated the schedule to reflect reality.

**Check twelve, the critical path test.** Your tool does something slightly clever here. It recomputes the CPM from scratch — its own forward and backward pass — and compares its calculated float against the float value stored in the XER file. If those disagree, something's wrong: usually the schedule wasn't recalculated after the last change, so the numbers people are reading are stale.

Now the four your tool **cannot** do, and this matters enormously.

**Check five, hard constraints.** Constraints are manual overrides — "this activity must start on this date regardless of logic." Too many constraints mean the schedule is being forced rather than calculated. Your tool can't assess this reliably from a plain XER.

**Check ten, resources.** Whether activities have labour, plant and materials assigned. Needs resource data that isn't in a basic export.

**Checks thirteen and fourteen, CPLI and BEI.** The Critical Path Length Index and Baseline Execution Index. Both measure current performance against the original baseline — so both need the baseline schedule, which is a separate file.

And here's the design decision I want you to specifically remember, because it's the strongest thing in the whole tool from a credibility standpoint. Those four checks are displayed as **"Not assessable."** Not faked. Not quietly dropped. Explicitly marked as something the tool cannot determine from the data it has.

That is the opposite of what a generated dashboard does. Generated dashboards fill every box, because empty boxes look unfinished. An engineer marks the boxes they can't fill, because a confident wrong answer is worse than an honest gap. If someone asks you what makes your tool different from a slick AI-generated demo, that's your answer, and it's a good one.

---

## Chapter Eleven — Program crashing

This is your niche, so let's do it properly.

The project's running late. Someone senior asks the question that always gets asked: **"What would it take to pull it back?"**

**Crashing** is the formal answer to that question. It means deliberately shortening activities by throwing resources at them — more crews, double shifts, weekend work, air-freighting a component instead of shipping it — and accepting that it costs more money.

The core insight, and this is the thing that makes it an engineering problem rather than a guessing game: **shortening a non-critical activity achieves absolutely nothing.**

Go back to our example. Steel delivery, activity C, has one day of float. If you pay to expedite it and get it there a day early, the project still takes eight days. You've spent money and changed nothing, because the formwork was the constraint, not the steel. You've just given C two days of float instead of one.

To make the project finish sooner, you must shorten something on the **critical path**. A, B, D or E.

Now, which one? That's where the cost side comes in. Every activity has a different cost of compression. Adding an extra excavator might cost three thousand a day. Adding a second concrete crew might cost eight thousand a day. Air-freighting a TBM bearing might cost tens of thousands. So you want the **cheapest** critical activity first. Obviously.

But here's the part that makes it genuinely non-trivial, and this is the bit to emphasise if you're asked about it.

**As you crash, the critical path moves.**

Say you crash activity B, the formwork, from two days down to one. Now the path through B is shorter. But activity C, the steel delivery, is still four days. At some point, if you keep shortening B, the steel delivery becomes the thing controlling the start of the rebar fixing. C's float drops to zero. C becomes critical.

And the moment that happens, crashing B further is worthless. You'd be shortening a path that's no longer the longest one. You have to switch to crashing C, or crash both.

So crashing isn't "find the cheapest activities and shorten them." It's an iterative process: find the critical path, crash the cheapest critical activity by one day, **recalculate the entire critical path**, and repeat. Every single step.

That recalculation-every-step is what your tool actually does, and it's the part that distinguishes real logic from a demo that just subtracts numbers.

---

## Chapter Twelve — Greedy versus optimal, and why the honest answer is better

Now, the limitation. And I want you to know this properly, because being able to state a limitation precisely is worth more in an interview than claiming perfection.

The method I just described — crash the cheapest critical activity, recalculate, repeat — is called a **greedy algorithm**. Greedy because at every step it takes the locally cheapest option without considering whether that choice will turn out badly later.

When there's a single dominant critical path, greedy gives you the correct, optimal answer. Straightforwardly.

But consider this. Suppose there are two parallel paths, both critical, both controlling the finish date. To shorten the project by one day, you have to shorten *both* paths by one day — because if you only shorten one, the other one still holds the finish date where it was.

A greedy algorithm handles this reasonably: it crashes one, recalculates, finds the other is still critical, crashes that too. It'll get there. But it might not find the *cheapest combination*, because it never looks ahead. There might be a single activity sitting on both paths — crash that one, and you shorten both simultaneously for one payment. A greedy step-by-step approach can miss that.

The mathematically optimal solution is a **linear programming** problem. You express the whole thing as a set of constraints and an objective function to minimise, and you solve it in one go rather than step by step. It's genuinely the right answer, and it's meaningfully more complex to implement.

So what do you say when someone asks?

You say: *"It's a greedy least-cost heuristic. It re-derives the critical path after every compression step, so it handles the critical path shifting between chains. On a single dominant critical path it's optimal. Where multiple parallel near-critical paths exist, it's a strong first-pass estimate rather than a globally optimal solution — the proper answer there is a linear program, which I haven't implemented."*

That answer does something specific for you. It shows you know what the algorithm does, you know what class of problem it belongs to, you know where it breaks, and you know what the correct alternative is. That combination — from a third-year — reads as engineering maturity. Claiming it's perfect would read as either naivety or dishonesty, and either one loses you the room.

---

## Chapter Thirteen — How the code actually works

Alright. The tool itself. I'm going to walk through it in the order the data flows, in plain language, so you can describe any part of it.

### Step one: the parser

There's a function called `parseXER`. It takes the raw text of an XER file and turns it into structured data the rest of the program can use.

It reads the file line by line. When it sees a line starting with percent-T, it notes "we're now in the TASK table" or whichever table it is. When it sees percent-F, it records the column names for that table. When it sees percent-R, it splits the line on tab characters and pairs each value with its column name, producing a record.

Then it does a bit of joining-up. Relationships in the file refer to activities by internal ID numbers, which are meaningless to a human, so it builds a lookup and converts those to activity codes. It attaches the work breakdown structure name to each activity. It attaches any Notebook entries. It converts durations from hours into days — P6 stores durations in hours, so a twenty-day activity is stored as one hundred and sixty, assuming an eight-hour day. And it counts how many successors each activity has, which the health check needs later.

Out the other end comes a clean list of activities, each knowing its own code, name, duration, dates, float, status, predecessors, and notes.

Important detail: **this all runs in the browser.** The file never gets uploaded anywhere. That's not incidental — schedule data is commercially sensitive, and "your data never leaves your machine" is a genuine selling point to anyone who'd be nervous about uploading a live project schedule to someone's website.

### Step two: the CPM engine

There's a function called `runCPM`. This is the heart of it, and it's the one to understand best.

First it does a **topological sort**. That means putting the activities in an order where every activity comes after all of its predecessors. You need this because you can't calculate an activity's early start until you've calculated the early finish of everything feeding into it. It does this recursively — for each activity, visit all its predecessors first, then add it to the list.

Then the **forward pass**. Walk the sorted list. For each activity, if it has no predecessors, its early start is the project start date. Otherwise, its early start is the *maximum* early finish among its predecessors — the last one to finish. Then early finish equals early start plus duration, counted in working days.

Then it finds the project finish, which is simply the latest early finish of any activity.

Then it builds a **successor map** — the reverse of the predecessor relationships, so it knows what comes after each activity as well as what comes before.

Then the **backward pass**. Walk the same list in reverse. If an activity has no successors, its late finish is the project finish date. Otherwise, its late finish is the *minimum* late start among its successors — the earliest one that needs to begin. Then late start equals late finish minus duration.

Then **float**, for every activity: the working days between its early finish and its late finish.

And that's the whole CPM engine. Sort, forward, backward, float. If you can describe those four steps and say "max going forward, min going backward" and explain why, you understand it.

One detail worth knowing because it causes real bugs: all the date arithmetic uses **working days**, skipping weekends. There are helper functions that add or subtract working days, stepping one calendar day at a time and only counting Monday to Friday. This is also a known limitation — real projects often have multiple calendars, with different crews working different patterns, plus public holidays. The tool currently assumes one standard five-day week for everything.

### Step three: the crashing engine

Function called `crashProject`. It implements exactly what chapter eleven described.

It starts by copying every activity's duration into a working set it can modify. Then it loops.

Each time round the loop: run the CPM to find the current critical path. Filter to activities that are critical *and* have crash information entered *and* haven't already been crashed to their limit. Sort those by cost per day, cheapest first. Take the cheapest one. Subtract one day from its duration. Add its cost to the running total. **Re-run the entire CPM.** Check how many days have been recovered against the original finish date. Record the step. Then go round again.

It stops when it hits the target recovery, or when there are no more activities available to crash, or after three hundred iterations as a safety guard against an infinite loop.

Two things worth pointing out about the design. First, it only considers activities where *you* have entered a maximum crash duration and a cost per day. It will not invent cost assumptions — if you haven't told it what compressing something costs, it won't touch it. That's deliberate: the engineering judgement stays with the human. Second, it records every step, so you get a full audit trail of what got crashed, in what order, at what cost — and that's what feeds the time-cost trade-off curve.

### Step four: the health check

Function called `renderHealthCheck`. It runs each of the DCMA checks we went through against the parsed data, counts up the results, compares them against the thresholds, and assigns a pass, warning, fail, or not-assessable status.

Nothing algorithmically complex here — it's counting and comparing. The value is in knowing *what* to count and *what* the thresholds should be, which is domain knowledge, not programming.

### Step five: the AI layer

And this is the bit where the design decision really matters.

When you press "Generate Narrative," the tool does **not** send the XER file to Claude. That's important. What it sends is a structured summary of everything the deterministic code has already calculated: the finish dates, the net slip, the list of slipped activities with their variance and float, the newly critical activities, the Notebook entries, and the crash results if you've run them.

So the arithmetic happens in code, where it's exact and repeatable and inspectable. The AI's job is narrow: turn numbers that already exist into readable professional prose.

And it's given strict instructions. Write in the tone of an experienced planning engineer. Use only the facts provided. **Do not invent causes for activities that have no Notebook entry** — instead say the variance is under investigation. Only flag potential extension-of-time entitlement where the logged reason genuinely supports it.

This is what makes your claim — "the AI shows its reasoning and a human can check it" — actually true rather than marketing. Every sentence it writes traces back to a number the code computed or a note a human logged. There's no step where it guesses at a figure. If you get asked "how do you know it isn't making things up," that architecture is your answer.

---

## Chapter Fourteen — What this is and isn't

Let me be very direct with you, because you asked the right question earlier about whether this is just an AI-generated website.

**What's genuinely real:** The CPM engine computes correctly. Change any input and the maths responds properly — it's not hardcoded. The crashing algorithm genuinely re-derives the critical path at each step. The DCMA checks implement a real standard, with honest gaps marked as gaps. The architecture keeps calculation separate from language generation, which is a deliberate and defensible design choice.

**What's weak right now:** It's only been tested on synthetic data — a project I invented, with delays I chose. It has never touched a real schedule. The visual design is generated and signals nothing. You directed the build rather than writing it, which is fine and normal, but it means the understanding has to be real or the whole thing falls apart under questioning. And no practitioner has used it or reacted to it.

**What closes that gap, in order:**

First, run a real XER file through it. This is the highest-value single action available to you. The moment it's parsed a real schedule, "synthetic demo" becomes "tested against a live project file" — and you will find bugs, and fixing them is real engineering work you can talk about.

Second, be able to explain everything in this document cold. Not read it — explain it. If you can be asked "why does the backward pass take the minimum" and answer without hesitating, nobody cares who typed the code.

Third, get one practitioner to look at it. "A planning engineer with ten years' experience told me X was useful and Y was wrong, so I changed Y" is a completely different artefact from a portfolio piece nobody has touched.

**And the framing that keeps you honest and still sounds strong:** don't claim you built it alone from nothing. Claim what's actually true — *"I identified a real workflow problem, specified the system, directed the build, and understand and can defend the engineering logic underneath it."*

That is a genuine and accurate description of what an engineer does when they work with contractors and consultants. It isn't a weaker story than "I coded it all myself." In a lot of ways it's a more relevant one.

---

## Chapter Fifteen — The short version

If you remember nothing else, remember this.

A schedule is activities, durations, and relationships.

The forward pass finds the earliest everything can happen — take the maximum of your predecessors.

The backward pass finds the latest everything can happen without delaying the project — take the minimum of your successors.

Float is late start minus early start. It's how much slack an activity has.

The critical path is the chain with zero float. It controls the finish date. Shortening anything else is wasted money.

Crashing means paying to shorten critical activities, cheapest first, recalculating the critical path after every single step because criticality moves.

Greedy crashing is optimal on a single critical path and an approximation when parallel paths exist — the proper answer there is a linear program.

The DCMA fourteen-point check tests whether a schedule is structurally trustworthy, and four of the checks can't be assessed from a plain XER export, which the tool says out loud rather than faking.

And the architecture that matters: the maths happens in deterministic code, and the AI only writes prose on top of numbers it didn't invent.

That's the whole thing. Go and run a real schedule through it.
